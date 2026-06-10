import { Storage } from './storage';
import { getPersonality } from './personality';
import { MemorySystem } from './memory';

export class CallSimulator {
  private storage: Storage;
  private container = document.getElementById('view-call')!;
  private synth = window.speechSynthesis;
  private recognition: any = null;
  private isCalling = false;
  private isListening = false;
  private isSpeaking = false;
  private femaleVoice: SpeechSynthesisVoice | null = null;
  private memory: MemorySystem;
  private callMessages: { role: string; content: string }[] = [];
  private statusEl: HTMLElement | null = null;

  constructor(storage: Storage) {
    this.storage = storage;
    this.memory = new MemorySystem(storage);
    this.loadVoice();
    speechSynthesis.onvoiceschanged = () => this.loadVoice();
  }

  private loadVoice() {
    const voices = this.synth.getVoices();
    this.femaleVoice =
      voices.find(v => v.lang.includes('hi') && /female|woman|lekha|swara/i.test(v.name)) ||
      voices.find(v => v.lang.includes('hi-IN')) ||
      voices.find(v => /female|woman|zira|heera|swara/i.test(v.name)) ||
      voices.find(v => v.lang.includes('hi')) ||
      voices[0] || null;
  }

  render() {
    this.container.innerHTML = `
      <div class="text-center space-y-6 p-6">
        <div class="w-28 h-28 rounded-full ${this.isCalling ? 'bg-primary/20 animate-pulse' : 'bg-cream border-2 border-beige-deep'} mx-auto flex items-center justify-center">
          <span class="text-5xl">🌸</span>
        </div>
        <div>
          <h3 class="text-xl font-medium">Aura</h3>
          <p class="text-sm text-steel">Your Girlfriend</p>
        </div>
        <p id="call-status" class="text-sm ${this.isCalling ? 'text-primary' : 'text-muted'}">${this.getStatusText()}</p>
        <div id="call-transcript" class="text-left max-h-40 overflow-y-auto space-y-2 text-sm px-4"></div>
        <div class="flex justify-center gap-6">
          ${this.isCalling ? `
            <button id="mute-btn" class="w-12 h-12 rounded-full ${this.isListening ? 'bg-cream border border-beige-deep' : 'bg-red-500/20 border border-red-500'} flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${this.isListening ? 'M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-16a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3z' : 'M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2'}"/></svg>
            </button>
          ` : ''}
          <button id="call-btn" class="${this.isCalling ? 'bg-red-500' : 'bg-green-500'} w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg">
            <svg class="w-7 h-7 ${this.isCalling ? 'rotate-[135deg]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          </button>
        </div>
      </div>
    `;

    this.statusEl = document.getElementById('call-status');

    document.getElementById('call-btn')?.addEventListener('click', () => {
      if (this.isCalling) this.endCall();
      else this.startCall();
    });

    document.getElementById('mute-btn')?.addEventListener('click', () => {
      if (this.isListening) this.stopListening();
      else this.startListening();
      this.render();
    });
  }

  private getStatusText(): string {
    if (!this.isCalling) return 'Tap to call her';
    if (this.isSpeaking) return 'Aura is talking... 💬';
    if (this.isListening) return 'Listening to you... 🎙️';
    return 'Connected 💕';
  }

  private updateStatus(text: string) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  private addTranscript(who: string, text: string) {
    const el = document.getElementById('call-transcript');
    if (!el) return;
    const color = who === 'You' ? 'text-primary' : 'text-ink';
    el.innerHTML += `<p><span class="${color} font-medium">${who}:</span> <span class="text-steel">${text}</span></p>`;
    el.scrollTop = el.scrollHeight;
  }

  startCall() {
    this.isCalling = true;
    this.callMessages = [];
    this.render();

    const userName = this.storage.get('userName') || 'baby';
    // Aura picks up and says hi
    setTimeout(() => {
      const greetings = [
        `Hii ${userName}! Bol na, kya chal raha hai?`,
        `Hey baby! Miss kar raha tha kya mujhe? 🤭`,
        `Arre ${userName}! Finally call kiya, bata kya haal hai`,
        `Haan bolo ${userName}, main sun rahi hoon`,
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      this.speak(greeting, () => {
        this.startListening();
      });
    }, 800);
  }

  private endCall() {
    this.isCalling = false;
    this.isListening = false;
    this.isSpeaking = false;
    this.synth.cancel();
    this.stopListening();
    this.callMessages = [];
    this.render();
  }

  private speak(text: string, onEnd?: () => void) {
    this.isSpeaking = true;
    this.updateStatus('Aura is talking... 💬');
    this.addTranscript('Aura', text);

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'hi-IN';
    utter.rate = 0.95;
    utter.pitch = 1.25;
    if (this.femaleVoice) utter.voice = this.femaleVoice;
    
    utter.onend = () => {
      this.isSpeaking = false;
      if (this.isCalling && onEnd) onEnd();
    };
    
    this.synth.speak(utter);
  }

  private startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.updateStatus('Speech recognition not supported 😕');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'hi-IN';
    this.recognition.interimResults = false;
    this.recognition.continuous = false;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.isListening = false;
      this.addTranscript('You', transcript);
      this.updateStatus('Thinking... 🤔');
      this.getAIReply(transcript);
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' && this.isCalling) {
        // No speech detected, try again
        setTimeout(() => { if (this.isCalling) this.startListening(); }, 500);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening && this.isCalling && !this.isSpeaking) {
        // Restart if still in call and nothing was said
        setTimeout(() => { if (this.isCalling && !this.isSpeaking) this.startListening(); }, 300);
      }
    };

    this.isListening = true;
    this.updateStatus('Listening to you... 🎙️');
    this.recognition.start();
  }

  private stopListening() {
    if (this.recognition) {
      this.isListening = false;
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }
  }

  private async getAIReply(userText: string) {
    const apiKey = this.storage.get('apiKey');
    if (!apiKey) { this.speak('Baby API key set karo na pehle'); return; }

    const provider = this.storage.get('apiProvider') || 'groq';
    const userName = this.storage.get('userName') || 'baby';
    const systemPrompt = getPersonality(userName) + this.memory.getMemoryContext() + '\n\nYou are ON A PHONE CALL right now. Keep responses SHORT (1-2 sentences max), conversational, like you\'re actually talking on phone. Be natural, react, ask follow-ups. Don\'t write long texts — this is spoken conversation.';

    this.callMessages.push({ role: 'user', content: userText });

    let url: string, model: string;
    if (provider === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      model = 'llama-3.3-70b-versatile';
    } else if (provider === 'gemini') {
      // Handle gemini separately
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      try {
        const contents = this.callMessages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.9, maxOutputTokens: 80 }
          })
        });
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Hmm sunai nahi diya, phir bol?';
        this.callMessages.push({ role: 'assistant', content: reply });
        this.speak(reply, () => { if (this.isCalling) this.startListening(); });
      } catch {
        this.speak('Arre connection issue hai yaar', () => { if (this.isCalling) this.startListening(); });
      }
      return;
    } else {
      url = 'https://api.openai.com/v1/chat/completions';
      model = 'gpt-4o-mini';
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, ...this.callMessages],
          temperature: 0.9,
          max_tokens: 80
        })
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Hmm sunai nahi diya, phir bol?';
      this.callMessages.push({ role: 'assistant', content: reply });
      this.speak(reply, () => { if (this.isCalling) this.startListening(); });
    } catch {
      this.speak('Connection issue aa raha hai baby', () => { if (this.isCalling) this.startListening(); });
    }
  }

  // Incoming call — shows full screen overlay automatically
  incomingCall() {
    if (Notification.permission === 'granted') {
      const n = new Notification('📞 Aura calling...', {
        body: 'Pick up! She wants to talk 💕',
        icon: '/favicon.svg',
        tag: 'aura-call',
        requireInteraction: true,
      });
      n.onclick = () => { window.focus(); n.close(); };
    }
    this.showIncomingUI();
  }

  private showIncomingUI() {
    const overlay = document.createElement('div');
    overlay.id = 'incoming-call-overlay';
    overlay.className = 'fixed inset-0 z-[100] bg-gradient-to-b from-[#0d0d0d] to-[#1a0a05] flex flex-col items-center justify-center text-white';
    overlay.innerHTML = `
      <div class="animate-pulse mb-6">
        <div class="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
          <span class="text-5xl">🌸</span>
        </div>
      </div>
      <h2 class="text-2xl font-medium mb-1">Aura</h2>
      <p class="text-white/60 text-sm mb-10">Incoming call...</p>
      <div class="flex gap-12">
        <button id="reject-call" class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
          <svg class="w-7 h-7 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        </button>
        <button id="accept-call" class="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-bounce">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        </button>
      </div>
      <div class="flex gap-12 mt-3">
        <span class="text-xs text-white/50">Decline</span>
        <span class="text-xs text-white/50">Accept</span>
      </div>
    `;
    document.body.appendChild(overlay);

    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);

    overlay.querySelector('#accept-call')!.addEventListener('click', () => {
      overlay.remove();
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      this.container.classList.remove('hidden');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.replace('text-primary', 'text-steel'));
      document.querySelector('[data-view="call"]')?.classList.replace('text-steel', 'text-primary');
      this.startCall();
    });

    overlay.querySelector('#reject-call')!.addEventListener('click', () => {
      overlay.remove();
      if (navigator.vibrate) navigator.vibrate(0);
    });
  }
}
