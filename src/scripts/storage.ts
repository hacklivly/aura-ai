export class Storage {
  private autoSaveInterval: number | null = null;

  constructor() {
    // Auto-save to Google Drive every 5 minutes
    this.autoSaveInterval = window.setInterval(() => this.saveToGDrive(), 5 * 60 * 1000);
  }

  get(key: string): string | null {
    return localStorage.getItem(`aura_${key}`);
  }
  set(key: string, value: string) {
    localStorage.setItem(`aura_${key}`, value);
  }
  getJSON<T>(key: string): T | null {
    const val = this.get(key);
    return val ? JSON.parse(val) : null;
  }
  setJSON(key: string, value: unknown) {
    this.set(key, JSON.stringify(value));
  }

  // Get all aura data
  private getAllData(): Record<string, string> {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('aura_')) data[key] = localStorage.getItem(key)!;
    }
    return data;
  }

  // Google Drive - save
  async saveToGDrive() {
    const token = this.get('gdriveToken');
    if (!token) return;

    const data = JSON.stringify(this.getAllData());
    const fileId = this.get('gdriveFileId');

    try {
      if (fileId) {
        // Update existing file
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: data
        });
      } else {
        // Create new file
        const metadata = { name: 'aura-backup.json', mimeType: 'application/json' };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([data], { type: 'application/json' }));

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: form
        });
        const result = await res.json();
        if (result.id) this.set('gdriveFileId', result.id);
      }
    } catch {}
  }

  // Google Drive - load
  async loadFromGDrive(): Promise<boolean> {
    const token = this.get('gdriveToken');
    if (!token) return false;

    try {
      // Find the file
      const search = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='aura-backup.json'&spaces=drive&fields=files(id)`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const result = await search.json();
      const fileId = result.files?.[0]?.id;
      if (!fileId) return false;

      this.set('gdriveFileId', fileId);

      // Download content
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value as string);
      });
      return true;
    } catch { return false; }
  }

  // Google OAuth - initiate
  startGoogleAuth() {
    const clientId = this.get('gdriveClientId');
    if (!clientId) {
      alert('Settings mein Google Client ID daalo pehle');
      return;
    }
    const redirect = window.location.origin + window.location.pathname;
    const scope = 'https://www.googleapis.com/auth/drive.file';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirect}&response_type=token&scope=${scope}`;
    window.location.href = url;
  }

  // Check for OAuth callback token in URL hash
  checkOAuthCallback() {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const token = new URLSearchParams(hash.slice(1)).get('access_token');
      if (token) {
        this.set('gdriveToken', token);
        window.location.hash = '';
        this.loadFromGDrive();
      }
    }
  }

  // Export as file (local backup)
  exportData() {
    const data = this.getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import from file
  importData(file: File): Promise<void> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const data = JSON.parse(reader.result as string);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
        resolve();
      };
      reader.readAsText(file);
    });
  }
}
