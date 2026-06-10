import { Storage } from './storage';

export class NotificationManager {
  private storage: Storage;
  private swReg: ServiceWorkerRegistration | null = null;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  async init() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if ('serviceWorker' in navigator) {
      this.swReg = await navigator.serviceWorker.register('/sw.js').catch(() => null);
    }
  }

  // Send notification via SW (will open app on tap)
  async send(title: string, body: string) {
    if (Notification.permission !== 'granted') return;
    if (this.swReg) {
      this.swReg.showNotification(title, {
        body,
        icon: '/favicon.svg',
        tag: 'aura-msg-' + Date.now(),
        requireInteraction: true,
        vibrate: [200, 100, 200],
      });
    } else {
      const n = new Notification(title, { body, icon: '/favicon.svg' });
      n.onclick = () => window.focus();
    }
  }
}
