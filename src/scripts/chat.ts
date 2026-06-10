import { Storage } from './storage';
import { getPersonality } from './personality';
import { MemorySystem } from './memory';
import { MongoSync } from './mongo';

interface Message {
  role: 'user' | 'ai';
  text: string;
  time: number;
  voiceUrl?: string;
}

export class ChatEngine {
  private messages: Message[] = [];
  private container = document.getElementById('chat-messages')!;
  private storage: Storage;
  private memory: MemorySystem;
  private mongo: MongoSync;

  constructor(storage: Storage) {
    this.storage = storage;
    this.messages = storage.getJSON<Message[]>('messages') || [];
    this.memory = new MemorySystem(storage);
    this.mongo = new MongoSync(storage);
    // Always load from MongoDB (cloud = source of truth)
    this.syncFromMongo();
  }

  private async syncFromMongo() {
    const docs = await this.mongo.loadMessages();
    if (docs.length > 0) {
      this.messages = docs.map(d => ({ role: d.role, text: d.text, time: d.time }));
      this.storage.setJSON('messages', this.messages);
      this.renderMessages();
    }
  }

  addMessage(role: 'user' | 'ai', text: string) {
    this.messages.push({ role, text, time: Date.now() });
    this.save();
    this.mongo.saveMessage(role, text);
  }

  addVoiceNote(blob: Blob) {
    const url = URL.createObjectURL(blob);
    this.messages.push({ role: 'user', text: '🎤 Voice note', time: Date.now(), voiceUrl: url });
    this.save();
  }

  private save() {
    // Don't save blob URLs
    const toSave = this.messages.map(m => ({ ...m, voiceUrl: undefined }));
    this.storage.setJSON('messages', toSave);
  }

  renderMessages() {
    this.container.innerHTML = this.messages.map(m => {
      const time = new Date(m.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const isAi = m.role === 'ai';
      const bubble = isAi
        ? 'bg-cream border border-beige-deep text-ink rounded-lg rounded-tl-none'
        : 'bg-primary text-white rounded-lg rounded-tr-none ml-auto';
      let content = `<p class="text-sm whitespace-pre-wrap">${this.escapeHtml(m.text)}</p>`;
      if (m.voiceUrl) {
        content += `<audio controls src="${m.voiceUrl}" class="mt-1 h-8 w-full"></audio>`;
      }
      return `<div class="max-w-[80%] ${isAi ? '' : 'ml-auto'}">
        <div class="px-3 py-2 ${bubble}">${content}</div>
        <p class="text-[10px] text-muted mt-0.5 ${isAi ? '' : 'text-right'}">${time}</p>
      </div>`;
    }).join('');
    this.container.scrollTop = this.container.scrollHeight;
  }

  async getReply(userText: string) {
    const apiKey = this.storage.get('apiKey');
    if (!apiKey) {
      this.addMessage('ai', 'Babe, pehle settings mein jaake API key daal do na 🥺 Phir main properly baat kar paungi!');
      this.renderMessages();
      return;
    }

    const provider = this.storage.get('apiProvider') || 'xai';
    const userName = this.storage.get('userName') || 'baby';
    const systemPrompt = getPersonality(userName) + this.memory.getMemoryContext();

    const recentMessages = this.messages.slice(-20).map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text
    }));

    let url: string, model: string;
    let isGemini = false;
    switch (provider) {
      case 'gemini':
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        model = '';
        isGemini = true;
        break;
      case 'xai':
        url = 'https://api.x.ai/v1/chat/completions';
        model = 'grok-4.3';
        break;
      case 'groq':
        url = 'https://api.groq.com/openai/v1/chat/completions';
        model = 'llama-3.3-70b-versatile';
        break;
      default:
        url = 'https://api.openai.com/v1/chat/completions';
        model = 'gpt-4o-mini';
    }

    try {
      let reply: string;
      if (isGemini) {
        const contents = recentMessages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.85, maxOutputTokens: 300 }
          })
        });
        const data = await res.json();
        if (data.error) {
          reply = `Error: ${data.error.message} 😕`;
        } else {
          reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Response khali aayi... 🥲';
        }
      } else {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [{ role: 'system', content: systemPrompt }, ...recentMessages],
            temperature: 0.85,
            max_tokens: 300
          })
        });
        const data = await res.json();
        if (data.error) {
          reply = `Error: ${data.error.message || JSON.stringify(data.error)} 😕`;
        } else {
          reply = data.choices?.[0]?.message?.content || 'Response khali aayi... 🥲';
        }
      }
      this.addMessage('ai', reply);
      // Extract memories in background
      this.memory.extractMemories(userText, reply);
    } catch (e: any) {
      this.addMessage('ai', `Connection issue: ${e.message} 😕`);
    }
    this.renderMessages();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
