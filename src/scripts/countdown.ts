import { Storage } from './storage';

export class NEETCountdown {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getExamDate(): string {
    return this.storage.get('neetDate') || '2025-05-04';
  }

  setExamDate(date: string) {
    this.storage.set('neetDate', date);
  }

  getDaysLeft(): number {
    const exam = new Date(this.getExamDate());
    const now = new Date();
    return Math.max(0, Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  getMilestoneMessage(): string | null {
    const days = this.getDaysLeft();
    const milestones: Record<number, string> = {
      365: "1 saal baaki hai! Long game hai but tu kar lega 💪",
      180: "6 months! Ab serious mode on karna padega baby",
      100: "100 DAYS LEFT! 🔥 Ab har din count hota hai",
      90: "3 months! Revision mode full on",
      60: "2 months baby! Mock tests daily now",
      30: "1 MONTH! 😤 Full focus, main bhi disturb nahi karungi zyada",
      14: "2 weeks! Almost there, tu ready hai ✨",
      7: "1 WEEK! Revise revise revise. I believe in you 🥺",
      3: "3 din! Aram se, sab yaad hai tujhe. Just stay calm 💕",
      1: "KAL HAI EXAM! Early so ja, main morning mein uthaungi. You've got this baby ❤️",
      0: "TODAY IS THE DAY! All the best my love. Jaa rock kar! 🚀🌟",
    };
    return milestones[days] || null;
  }

  getMotivation(): string {
    const days = this.getDaysLeft();
    if (days > 100) return `${days} days to NEET. Steady steady, no rush.`;
    if (days > 30) return `${days} days left. Focus mode: ON 🎯`;
    if (days > 7) return `Only ${days} days! You're almost there baby 💪`;
    return `${days} days! Final countdown 🔥`;
  }
}
