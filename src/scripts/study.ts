import { Storage } from './storage';

interface StudySession {
  date: string;
  subject: string;
  minutes: number;
  timestamp: number;
}

export class StudyBuddy {
  private storage: Storage;
  private timer: number | null = null;
  private startTime: number = 0;
  private targetMinutes: number = 0;
  private subject: string = '';
  private isActive = false;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getSessions(): StudySession[] {
    return this.storage.getJSON<StudySession[]>('studySessions') || [];
  }

  getStreak(): number {
    const sessions = this.getSessions();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (sessions.some(s => s.date === dateStr)) streak++;
      else break;
    }
    return streak;
  }

  getTodayMinutes(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.getSessions().filter(s => s.date === today).reduce((sum, s) => sum + s.minutes, 0);
  }

  startSession(subject: string, minutes: number, onComplete: () => void) {
    this.subject = subject;
    this.targetMinutes = minutes;
    this.startTime = Date.now();
    this.isActive = true;
    this.timer = window.setTimeout(() => {
      this.completeSession();
      onComplete();
    }, minutes * 60 * 1000);
  }

  private completeSession() {
    const sessions = this.getSessions();
    sessions.push({
      date: new Date().toISOString().split('T')[0],
      subject: this.subject,
      minutes: this.targetMinutes,
      timestamp: Date.now()
    });
    this.storage.setJSON('studySessions', sessions);
    this.isActive = false;
  }

  stopSession(): number {
    if (this.timer) clearTimeout(this.timer);
    const elapsed = Math.round((Date.now() - this.startTime) / 60000);
    if (elapsed > 0) {
      const sessions = this.getSessions();
      sessions.push({
        date: new Date().toISOString().split('T')[0],
        subject: this.subject,
        minutes: elapsed,
        timestamp: Date.now()
      });
      this.storage.setJSON('studySessions', sessions);
    }
    this.isActive = false;
    return elapsed;
  }

  getElapsed(): number {
    return Math.round((Date.now() - this.startTime) / 60000);
  }

  isStudying(): boolean { return this.isActive; }
  getSubject(): string { return this.subject; }
  getTarget(): number { return this.targetMinutes; }
}
