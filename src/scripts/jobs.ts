import { Storage } from './storage';

interface JobUpdate {
  title: string;
  lastDate: string;
  link: string;
  category: string;
}

// Curated exam/job sources relevant to PCB+M students
const JOB_KEYWORDS = ['NEET', 'AIIMS', 'JIPMER', 'NTA', 'CSIR', 'ICAR', 'Railway', 'SSC', 'UPSC', 'NDA', 'CDS', 'DRDO', 'ISRO', 'IIT JAM', 'CUET', 'GATE', 'Indian Army', 'Navy', 'Air Force', 'AFCAT'];

const SOURCES = [
  'https://www.sarkariresult.com/rss/latestjob.xml',
  'https://www.sarkariresult.com/rss/admitcard.xml',
];

export class JobUpdates {
  private storage: Storage;
  private updates: JobUpdate[] = [];

  constructor(storage: Storage) {
    this.storage = storage;
    this.updates = storage.getJSON<JobUpdate[]>('jobUpdates') || [];
  }

  async fetchUpdates(): Promise<void> {
    // Use a CORS proxy since sarkariresult doesn't allow direct access
    const proxyUrl = 'https://api.allorigins.win/raw?url=';

    for (const source of SOURCES) {
      try {
        const res = await fetch(proxyUrl + encodeURIComponent(source));
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');

        items.forEach(item => {
          const title = item.querySelector('title')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';

          // Filter relevant to PCB+M students
          const isRelevant = JOB_KEYWORDS.some(k => title.toLowerCase().includes(k.toLowerCase())) ||
            /medical|science|biology|physics|chemistry|math|health|pharma|nursing|lab|research|army|navy|defence/i.test(title);

          if (isRelevant && !this.updates.some(u => u.title === title)) {
            this.updates.push({
              title,
              lastDate: pubDate,
              link,
              category: this.categorize(title)
            });
          }
        });
      } catch {}
    }

    // Keep last 50 updates
    this.updates = this.updates.slice(-50);
    this.storage.setJSON('jobUpdates', this.updates);
    this.storage.set('lastJobFetch', Date.now().toString());
  }

  private categorize(title: string): string {
    const t = title.toLowerCase();
    if (/neet|aiims|medical|jipmer|health|nursing|pharma/i.test(t)) return '🏥 Medical';
    if (/army|navy|air force|nda|cds|afcat|defence/i.test(t)) return '🎖️ Defence';
    if (/railway|rrb/i.test(t)) return '🚂 Railway';
    if (/ssc|upsc|state/i.test(t)) return '📋 Govt Exam';
    if (/research|csir|icar|drdo|isro|scientist/i.test(t)) return '🔬 Research';
    if (/gate|iit|jam|cuet/i.test(t)) return '🎓 Higher Education';
    return '📄 Other';
  }

  getLatest(count = 10): JobUpdate[] {
    return this.updates.slice(-count).reverse();
  }

  getNewSinceLast(): JobUpdate[] {
    const lastShown = parseInt(this.storage.get('lastJobShown') || '0');
    const newer = this.updates.filter(u => new Date(u.lastDate).getTime() > lastShown);
    this.storage.set('lastJobShown', Date.now().toString());
    return newer.slice(0, 5);
  }

  shouldFetch(): boolean {
    const last = parseInt(this.storage.get('lastJobFetch') || '0');
    return Date.now() - last > 6 * 60 * 60 * 1000; // Every 6 hours
  }

  // Format for Aura to send as message
  formatForChat(updates: JobUpdate[]): string {
    if (updates.length === 0) return '';
    let msg = "Suno baby! 📋 Kuch new forms/jobs aaye hain tere liye:\n\n";
    updates.slice(0, 4).forEach(u => {
      msg += `${u.category} ${u.title}\n`;
    });
    msg += "\nDetails ke liye Tracker tab check kar!";
    return msg;
  }
}
