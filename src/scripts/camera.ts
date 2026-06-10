import { Storage } from './storage';

export class CameraVision {
  private storage: Storage;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private stream: MediaStream | null = null;
  private interval: number | null = null;
  private onSnapshot: (description: string) => void = () => {};

  constructor(storage: Storage) {
    this.storage = storage;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;
  }

  async start(onSnapshot: (description: string) => void) {
    this.onSnapshot = onSnapshot;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      });
      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.play();
      // Capture every 5 minutes
      this.interval = window.setInterval(() => this.capture(), 5 * 60 * 1000);
      // First capture after 10 seconds
      setTimeout(() => this.capture(), 10000);
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.video = null;
  }

  isActive(): boolean {
    return this.stream !== null;
  }

  private async capture() {
    if (!this.video || !this.stream) return;
    const ctx = this.canvas.getContext('2d')!;
    ctx.drawImage(this.video, 0, 0, 640, 480);
    const base64 = this.canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
    await this.analyzeImage(base64);
  }

  private async analyzeImage(base64: string) {
    const apiKey = this.storage.get('apiKey');
    const provider = this.storage.get('apiProvider') || 'groq';
    if (!apiKey) return;

    // Use vision-capable model
    let url: string, model: string;
    if (provider === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      model = 'llama-3.2-90b-vision-preview';
    } else if (provider === 'gemini') {
      // Gemini handles vision differently
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: 'You are Aura, a 22 year old girl (his girlfriend). You just saw what he is doing through camera. In 1-2 short Hinglish sentences, react to what you see or ask a question about it. Be casual, curious, teasing, or caring based on what you see. Examples: if studying - "ooh padhai chal rahi hai! konsa chapter?", if eating - "kya kha raha hai? mujhe bhi bhook lagi", if on phone - "phone scroll kar raha hai... padhai ka kya hua 🤨". Be natural and short.' },
            { inline_data: { mime_type: 'image/jpeg', data: base64 } }
          ]}]
        })
      });
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) this.onSnapshot(reply);
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
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'You are Aura, a 22 year old girl (his girlfriend). You just saw what he is doing through camera. In 1-2 short Hinglish sentences, react to what you see or ask a question about it. Be casual, curious, teasing, or caring based on what you see. Be natural and short like real texting.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
            ]
          }],
          max_tokens: 100
        })
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) this.onSnapshot(reply);
    } catch {}
  }
}
