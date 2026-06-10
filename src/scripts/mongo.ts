import { Storage } from './storage';

export class MongoSync {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  private getUserId(): string {
    // Use username as userId so all devices share same chats
    return this.storage.get('userName') || 'default_user';
  }

  isConfigured(): boolean { return true; } // Always on — uses our own API

  async saveMessage(role: 'user' | 'ai', text: string) {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.getUserId(), role, text, time: Date.now() })
      });
    } catch {}
  }

  async loadMessages(): Promise<{ role: 'user' | 'ai'; text: string; time: number }[]> {
    try {
      const res = await fetch(`/api/messages?userId=${this.getUserId()}`);
      return await res.json();
    } catch { return []; }
  }

  async saveMemory(facts: unknown[]) {
    try {
      await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.getUserId(), facts })
      });
    } catch {}
  }

  async loadMemory(): Promise<unknown[]> {
    try {
      const res = await fetch(`/api/memories?userId=${this.getUserId()}`);
      return await res.json();
    } catch { return []; }
  }
}
