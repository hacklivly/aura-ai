import { Storage } from './storage';
import { StudyBuddy } from './study';
import { NEETCountdown } from './countdown';
import { MoodJournal } from './mood';
import { JobUpdates } from './jobs';

export class Tracker {
  private storage: Storage;
  private container = document.getElementById('view-tracker')!;
  private study: StudyBuddy;
  private countdown: NEETCountdown;
  private mood: MoodJournal;
  private jobs: JobUpdates;
  private timerInterval: number | null = null;

  constructor(storage: Storage) {
    this.storage = storage;
    this.study = new StudyBuddy(storage);
    this.countdown = new NEETCountdown(storage);
    this.mood = new MoodJournal(storage);
    this.jobs = new JobUpdates(storage);
  }

  startHourlyCheck() {
    setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 8 && hour <= 23 && Notification.permission === 'granted') {
        if (!this.study.isStudying() && this.study.getTodayMinutes() < 60) {
          new Notification('Aura 🌸', { body: 'Padhai ka kya hua? Timer start karo na 📚', icon: '/favicon.svg' });
        }
      }
    }, 60 * 60 * 1000);
  }

  render() {
    const streak = this.study.getStreak();
    const todayMins = this.study.getTodayMinutes();
    const daysLeft = this.countdown.getDaysLeft();
    const moodSummary = this.mood.getWeekSummary();

    this.container.innerHTML = `
      <!-- NEET Countdown -->
      <div class="bg-cream border border-beige-deep rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-steel uppercase font-medium">NEET Countdown</p>
            <p class="text-3xl font-bold text-primary">${daysLeft}</p>
            <p class="text-xs text-steel">days left</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-steel">Exam Date</p>
            <input id="neet-date" type="date" value="${this.countdown.getExamDate()}" class="text-sm bg-transparent border border-beige-deep rounded px-2 py-1 text-ink" />
          </div>
        </div>
      </div>

      <!-- Study Timer -->
      <div class="bg-cream border border-beige-deep rounded-lg p-4 mb-4">
        <h3 class="text-sm font-medium mb-3">📚 Study Timer</h3>
        ${this.study.isStudying() ? this.renderActiveTimer() : this.renderStartTimer()}
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-beige-deep">
          <div class="text-center">
            <p class="text-xl font-bold text-primary">${todayMins}</p>
            <p class="text-[10px] text-steel">mins today</p>
          </div>
          <div class="text-center">
            <p class="text-xl font-bold text-primary">${streak}</p>
            <p class="text-[10px] text-steel">day streak 🔥</p>
          </div>
          <div class="text-center">
            <p class="text-xl font-bold text-primary">${Math.round(todayMins / 60 * 10) / 10}</p>
            <p class="text-[10px] text-steel">hours today</p>
          </div>
        </div>
      </div>

      <!-- Mood This Week -->
      <div class="bg-cream border border-beige-deep rounded-lg p-4 mb-4">
        <h3 class="text-sm font-medium mb-2">😊 Mood This Week</h3>
        <div class="flex gap-2 flex-wrap">
          ${Object.entries(moodSummary).map(([mood, count]) => 
            `<span class="text-xs bg-canvas border border-beige-deep rounded-full px-2 py-1">${this.moodEmoji(mood)} ${mood} (${count})</span>`
          ).join('') || '<p class="text-xs text-muted">No mood data yet — keep chatting!</p>'}
        </div>
        <div class="flex gap-2 mt-3">
          ${['happy','neutral','stressed','sad','tired','excited'].map(m => 
            `<button class="mood-btn text-lg" data-mood="${m}" title="${m}">${this.moodEmoji(m)}</button>`
          ).join('')}
        </div>
      </div>

      <!-- Jobs & Forms -->
      <div class="bg-cream border border-beige-deep rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium">📋 Forms & Jobs (PCB+M)</h3>
          <button id="refresh-jobs" class="text-xs text-primary">Refresh</button>
        </div>
        <div class="space-y-2" id="jobs-list">
          ${this.jobs.getLatest(8).map(j => `
            <a href="${j.link}" target="_blank" class="block p-2 rounded-md border border-beige-deep bg-canvas">
              <p class="text-xs font-medium text-ink leading-tight">${j.title}</p>
              <p class="text-[10px] text-steel mt-1">${j.category}</p>
            </a>
          `).join('') || '<p class="text-xs text-muted">Loading updates... refresh karein</p>'}
        </div>
      </div>
      </div>
    `;

    // Event listeners
    document.getElementById('neet-date')?.addEventListener('change', (e) => {
      this.countdown.setExamDate((e.target as HTMLInputElement).value);
      this.render();
    });

    document.getElementById('start-study')?.addEventListener('click', () => {
      const subject = (document.getElementById('study-subject') as HTMLInputElement).value || 'General';
      const mins = parseInt((document.getElementById('study-mins') as HTMLInputElement).value) || 60;
      this.study.startSession(subject, mins, () => {
        if (Notification.permission === 'granted') {
          new Notification('Aura 🌸', { body: `${mins} minutes ho gaye! Break le lo baby ✨`, icon: '/favicon.svg' });
        }
        this.render();
      });
      this.render();
      this.startLiveTimer();
    });

    document.getElementById('stop-study')?.addEventListener('click', () => {
      const elapsed = this.study.stopSession();
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.render();
    });

    this.container.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.mood.addMood((btn as HTMLElement).dataset.mood as any);
        this.render();
      });
    });

    // Jobs refresh
    document.getElementById('refresh-jobs')?.addEventListener('click', async () => {
      await this.jobs.fetchUpdates();
      this.render();
    });

    // Auto-fetch if stale
    if (this.jobs.shouldFetch()) this.jobs.fetchUpdates().then(() => this.render());
  }

  private renderStartTimer(): string {
    return `
      <div class="flex gap-2">
        <input id="study-subject" type="text" placeholder="Subject" class="flex-1 rounded-md border border-beige-deep bg-canvas px-2 py-1.5 text-sm" />
        <input id="study-mins" type="number" value="60" min="10" max="300" class="w-16 rounded-md border border-beige-deep bg-canvas px-2 py-1.5 text-sm text-center" />
        <button id="start-study" class="bg-primary text-white rounded-md px-3 py-1.5 text-sm font-medium">Go</button>
      </div>
    `;
  }

  private renderActiveTimer(): string {
    const elapsed = this.study.getElapsed();
    const target = this.study.getTarget();
    const pct = Math.min(100, Math.round((elapsed / target) * 100));
    return `
      <div class="text-center">
        <p class="text-xs text-steel mb-1">${this.study.getSubject()} — ${elapsed}/${target} min</p>
        <div class="w-full bg-canvas rounded-full h-2 mb-2">
          <div class="bg-primary h-2 rounded-full transition-all" style="width:${pct}%"></div>
        </div>
        <p id="live-timer" class="text-2xl font-bold text-primary">${elapsed}:00</p>
        <button id="stop-study" class="mt-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md px-4 py-1.5 text-sm">Stop</button>
      </div>
    `;
  }

  private startLiveTimer() {
    this.timerInterval = window.setInterval(() => {
      const el = document.getElementById('live-timer');
      if (el && this.study.isStudying()) {
        const elapsed = this.study.getElapsed();
        el.textContent = `${elapsed}:00`;
      }
    }, 60000);
  }

  private moodEmoji(mood: string): string {
    const map: Record<string, string> = { happy: '😊', neutral: '😐', stressed: '😰', sad: '😢', tired: '😴', excited: '🤩' };
    return map[mood] || '😐';
  }
}
