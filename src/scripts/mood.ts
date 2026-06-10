import { Storage } from './storage';

interface MoodEntry {
  date: string;
  hour: number;
  mood: 'happy' | 'neutral' | 'stressed' | 'sad' | 'tired' | 'excited';
  note?: string;
}

export class MoodJournal {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getEntries(): MoodEntry[] {
    return this.storage.getJSON<MoodEntry[]>('moods') || [];
  }

  addMood(mood: MoodEntry['mood'], note?: string) {
    const entries = this.getEntries();
    entries.push({ date: new Date().toISOString().split('T')[0], hour: new Date().getHours(), mood, note });
    this.storage.setJSON('moods', entries);
  }

  getWeekSummary(): Record<string, number> {
    const entries = this.getEntries();
    const week = new Date();
    week.setDate(week.getDate() - 7);
    const weekStr = week.toISOString().split('T')[0];
    const recent = entries.filter(e => e.date >= weekStr);
    const counts: Record<string, number> = {};
    recent.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
    return counts;
  }

  getDominantMood(): string {
    const summary = this.getWeekSummary();
    let max = 0, dominant = 'neutral';
    Object.entries(summary).forEach(([mood, count]) => {
      if (count > max) { max = count; dominant = mood; }
    });
    return dominant;
  }

  // Auto-detect mood from message text
  detectMood(text: string): MoodEntry['mood'] | null {
    const lower = text.toLowerCase();
    if (/happy|khush|mast|great|awesome|accha|maza|🥳|😊|🎉/.test(lower)) return 'happy';
    if (/stressed|tension|pressure|anxious|overwhelm|😰|😫/.test(lower)) return 'stressed';
    if (/sad|dukhi|low|down|lonely|😢|😭|🥺/.test(lower)) return 'sad';
    if (/tired|thak|neend|sleepy|exhausted|😴|🥱/.test(lower)) return 'tired';
    if (/excited|pumped|hyped|can't wait|🔥|💪|🤩/.test(lower)) return 'excited';
    return null;
  }
}
