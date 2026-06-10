import { Storage } from './storage';
import { StudyBuddy } from './study';
import { MoodJournal } from './mood';
import { CoupleGames } from './games';
import { NEETCountdown } from './countdown';
import { SurpriseSystem } from './surprise';
import { JobUpdates } from './jobs';

export class ProactiveAI {
  private storage: Storage;
  private study: StudyBuddy;
  private mood: MoodJournal;
  private games: CoupleGames;
  private countdown: NEETCountdown;
  private surprise: SurpriseSystem;
  private jobs: JobUpdates;

  constructor(storage: Storage) {
    this.storage = storage;
    this.study = new StudyBuddy(storage);
    this.mood = new MoodJournal(storage);
    this.games = new CoupleGames(storage);
    this.countdown = new NEETCountdown(storage);
    this.surprise = new SurpriseSystem(storage);
    this.jobs = new JobUpdates(storage);
  }

  start(onMessage: (msg: string) => void, onCall: () => void) {
    // Surprise/Nvira/Morning/Night messages — every 1.5-3 hours
    this.scheduleRandom(() => {
      const msg = this.surprise.getTimedMessage();
      if (msg) { onMessage(msg); this.notify(msg); }
    }, 90 * 60 * 1000, 180 * 60 * 1000);

    // Games — every 3-5 hours
    this.scheduleRandom(() => {
      const hour = new Date().getHours();
      if (hour >= 18 && hour <= 23) { // Games mainly in evening
        const game = this.games.getRandomGame();
        onMessage(game.content);
        this.notify(game.content);
      }
    }, 3 * 60 * 60 * 1000, 5 * 60 * 60 * 1000);

    // NEET countdown check — once daily
    this.scheduleRandom(() => {
      const milestone = this.countdown.getMilestoneMessage();
      const lastMilestone = this.storage.get('lastMilestoneDate');
      const today = new Date().toISOString().split('T')[0];
      if (milestone && lastMilestone !== today) {
        this.storage.set('lastMilestoneDate', today);
        onMessage(milestone);
        this.notify(milestone);
      }
    }, 4 * 60 * 60 * 1000, 8 * 60 * 60 * 1000);

    // Study check-in — if NOT studying, nudge during study hours
    this.scheduleRandom(() => {
      const hour = new Date().getHours();
      if (hour >= 9 && hour <= 21 && !this.study.isStudying()) {
        const todayMins = this.study.getTodayMinutes();
        let msg: string;
        if (todayMins === 0) {
          msg = "Baby aaj toh ek minute bhi padhai nahi hui... 🥺 chal start kar, main timer set karti hoon";
        } else if (todayMins < 120) {
          msg = `Sirf ${todayMins} minutes padhai aaj? Chal ek aur session karte hain 💪`;
        } else {
          msg = `${todayMins} minutes done today! Accha hai but aur karo thoda, NEET ke liye zaruri hai ✨`;
        }
        onMessage(msg);
        this.notify(msg);
      }
    }, 2 * 60 * 60 * 1000, 4 * 60 * 60 * 1000);

    // Mood based messages — check weekly mood
    this.scheduleRandom(() => {
      const dominant = this.mood.getDominantMood();
      const msgs: Record<string, string> = {
        stressed: "Baby, is week tu bohot stressed lag raha hai mujhe... kya ho raha hai? Baat kar mujhse 🥺",
        sad: "Hey, mujhe lag raha hai tu thoda low hai... I'm here okay? Kuch bhi bol sakta hai mujhe 💕",
        tired: "Tu bohot thak raha hai lately... rest bhi important hai yaar. Please apna khayal rakh 😴",
        happy: "Yaar tu is week mein bohot khush lag raha hai! Love to see it 🥰 keep going",
        excited: "Teri energy is week 🔥 kya chal raha hai jo itna pump hai?",
      };
      const msg = msgs[dominant];
      if (msg && dominant !== 'neutral') {
        const lastMoodMsg = this.storage.get('lastMoodMsg');
        const today = new Date().toISOString().split('T')[0];
        if (lastMoodMsg !== today) {
          this.storage.set('lastMoodMsg', today);
          onMessage(msg);
        }
      }
    }, 6 * 60 * 60 * 1000, 12 * 60 * 60 * 1000);

    // Random call — every 3-6 hours
    this.scheduleRandom(() => {
      const hour = new Date().getHours();
      if (hour >= 10 && hour <= 21 && !this.study.isStudying()) onCall();
    }, 3 * 60 * 60 * 1000, 6 * 60 * 60 * 1000);

    // Job/Form updates — every 6 hours
    this.scheduleRandom(async () => {
      if (this.jobs.shouldFetch()) {
        await this.jobs.fetchUpdates();
        const newJobs = this.jobs.getNewSinceLast();
        const msg = this.jobs.formatForChat(newJobs);
        if (msg) { onMessage(msg); this.notify('Naye forms aaye hain! Check karo 📋'); }
      }
    }, 6 * 60 * 60 * 1000, 8 * 60 * 60 * 1000);

    // Initial job fetch after 15 seconds
    setTimeout(async () => {
      if (this.jobs.shouldFetch()) {
        await this.jobs.fetchUpdates();
      }
    }, 15000);

    // Initial message after 20 seconds
    setTimeout(() => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour <= 8) {
        onMessage(this.surprise.getMorningMessage());
      } else if (hour >= 22 || hour <= 2) {
        onMessage(this.surprise.getNightMessage());
      }
    }, 20000);
  }

  private scheduleRandom(fn: () => void, minMs: number, maxMs: number) {
    const run = () => {
      const delay = minMs + Math.random() * (maxMs - minMs);
      setTimeout(() => { fn(); run(); }, delay);
    };
    run();
  }

  private notify(msg: string) {
    if (Notification.permission === 'granted') {
      new Notification('Aura 🌸', {
        body: msg.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim().slice(0, 100),
        icon: '/favicon.svg',
        tag: 'aura-' + Date.now(),
      });
    }
  }

  // Expose for use in chat command parsing
  getStudy() { return this.study; }
  getMood() { return this.mood; }
  getGames() { return this.games; }
  getCountdown() { return this.countdown; }
}
