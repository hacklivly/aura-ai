import { Storage } from './storage';

interface Memory {
  fact: string;
  timestamp: number;
}

export class MemorySystem {
  private storage: Storage;
  private memories: Memory[] = [];

  constructor(storage: Storage) {
    this.storage = storage;
    this.memories = storage.getJSON<Memory[]>('memories') || [];
  }

  // Extract and store key facts from conversation
  async extractMemories(userMsg: string, aiReply: string) {
    const apiKey = this.storage.get('apiKey');
    if (!apiKey) return;

    const provider = this.storage.get('apiProvider') || 'groq';
    const url = provider === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

    if (provider === 'gemini') {
      // Skip memory extraction for gemini to keep it simple
      this.simpleExtract(userMsg);
      return;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'system',
            content: 'Extract key personal facts from this conversation that a girlfriend should remember. Return ONLY a JSON array of short strings. If nothing worth remembering, return []. Examples of good facts: "he ate pizza today", "he studied biology for 3 hours", "he feels stressed about physics", "his exam is on march 15", "he likes cold coffee". Max 3 facts.'
          }, {
            role: 'user',
            content: `User said: "${userMsg}"\nGirlfriend replied: "${aiReply}"`
          }],
          temperature: 0.3,
          max_tokens: 150
        })
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      try {
        const facts: string[] = JSON.parse(content.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
        facts.forEach(fact => this.addMemory(fact));
      } catch {}
    } catch {}
  }

  private simpleExtract(msg: string) {
    // Basic keyword extraction for when AI extraction isn't available
    const lower = msg.toLowerCase();
    if (lower.includes('exam') || lower.includes('test')) this.addMemory(`mentioned exam/test: "${msg.slice(0, 60)}"`);
    if (lower.includes('feeling') || lower.includes('feel')) this.addMemory(`expressed feeling: "${msg.slice(0, 60)}"`);
    if (lower.includes('tomorrow') || lower.includes('kal')) this.addMemory(`plans for tomorrow: "${msg.slice(0, 60)}"`);
  }

  private addMemory(fact: string) {
    // Avoid duplicates
    if (this.memories.some(m => m.fact.toLowerCase() === fact.toLowerCase())) return;
    this.memories.push({ fact, timestamp: Date.now() });
    // Keep last 50 memories
    if (this.memories.length > 50) this.memories = this.memories.slice(-50);
    this.storage.setJSON('memories', this.memories);
  }

  // Get relevant memories to inject into prompt
  getMemoryContext(): string {
    if (this.memories.length === 0) return '';
    const recent = this.memories.slice(-20).map(m => `- ${m.fact}`).join('\n');
    return `\n\nTHINGS YOU REMEMBER ABOUT HIM (use these naturally, don't list them):\n${recent}`;
  }
}
