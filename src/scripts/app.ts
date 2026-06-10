import { ChatEngine } from './chat';
import { VoiceRecorder } from './voice';
import { Tracker } from './tracker';
import { TodoManager } from './todos';
import { CallSimulator } from './call';
import { NotificationManager } from './notifications';
import { ProactiveAI } from './proactive';
import { MoodJournal } from './mood';
import { Storage } from './storage';

// Initialize
const storage = new Storage();
const chat = new ChatEngine(storage);
const voice = new VoiceRecorder();
const tracker = new Tracker(storage);
const todos = new TodoManager(storage);
const call = new CallSimulator(storage);
const notifications = new NotificationManager(storage);
const proactive = new ProactiveAI(storage);
const mood = new MoodJournal(storage);

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = (btn as HTMLElement).dataset.view!;
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${view}`)!.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.replace('text-primary', 'text-steel'));
    btn.classList.replace('text-steel', 'text-primary');
    if (view === 'tracker') tracker.render();
    if (view === 'todos') todos.render();
    if (view === 'call') call.render();
  });
});

// Chat
const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn')!;

sendBtn.addEventListener('click', () => sendMessage());
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  chatInput.style.height = 'auto';

  // Auto-detect mood from message
  const detected = mood.detectMood(text);
  if (detected) mood.addMood(detected, text.slice(0, 50));

  chat.addMessage('user', text);
  chat.renderMessages();
  await chat.getReply(text);
}

// Voice Note
const voiceBtn = document.getElementById('voice-note-btn')!;
const voiceOverlay = document.getElementById('voice-overlay')!;
const stopBtn = document.getElementById('stop-recording')!;
const voiceTimer = document.getElementById('voice-timer')!;
let timerInterval: number;

voiceBtn.addEventListener('click', async () => {
  await voice.start();
  voiceOverlay.classList.remove('hidden');
  let seconds = 0;
  timerInterval = window.setInterval(() => {
    seconds++;
    voiceTimer.textContent = `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2,'0')}`;
  }, 1000);
});

stopBtn.addEventListener('click', async () => {
  clearInterval(timerInterval);
  voiceOverlay.classList.add('hidden');
  voiceTimer.textContent = '0:00';
  const blob = await voice.stop();
  if (blob) {
    chat.addVoiceNote(blob);
    chat.renderMessages();
    await chat.getReply('[Voice note received]');
  }
});

// Settings
const settingsBtn = document.getElementById('settings-btn')!;
const settingsModal = document.getElementById('settings-modal')!;
const saveSettings = document.getElementById('save-settings')!;
const closeSettings = document.getElementById('close-settings')!;

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
  (document.getElementById('api-key-input') as HTMLInputElement).value = storage.get('apiKey') || '';
  (document.getElementById('api-provider') as HTMLSelectElement).value = storage.get('apiProvider') || 'groq';
  (document.getElementById('user-name-input') as HTMLInputElement).value = storage.get('userName') || '';
});

saveSettings.addEventListener('click', () => {
  storage.set('apiKey', (document.getElementById('api-key-input') as HTMLInputElement).value);
  storage.set('apiProvider', (document.getElementById('api-provider') as HTMLSelectElement).value);
  storage.set('userName', (document.getElementById('user-name-input') as HTMLInputElement).value);
  settingsModal.classList.add('hidden');
});

closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

// Backup export/import
document.getElementById('export-data')?.addEventListener('click', () => storage.exportData());
document.getElementById('import-data')?.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await storage.importData(file);
    settingsModal.classList.add('hidden');
    location.reload();
  }
});

// Google Drive
document.getElementById('gdrive-connect')?.addEventListener('click', () => {
  const clientId = (document.getElementById('gdrive-client-id') as HTMLInputElement).value;
  if (clientId) storage.set('gdriveClientId', clientId);
  storage.startGoogleAuth();
});
document.getElementById('gdrive-sync')?.addEventListener('click', () => storage.saveToGDrive());

// Check OAuth callback on page load
storage.checkOAuthCallback();

// Auto-resize textarea
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

// Init
chat.renderMessages();
tracker.startHourlyCheck();
notifications.init();

// Proactive AI — sends messages, games, surprises, and triggers calls
proactive.start(
  (msg) => {
    chat.addMessage('ai', msg);
    chat.renderMessages();
  },
  () => call.incomingCall()
);

// Show welcome if first time
if (!storage.get('welcomed')) {
  storage.set('welcomed', 'true');
  storage.set('apiProvider', 'groq');
  storage.set('apiKey', '');
  setTimeout(() => {
    chat.addMessage('ai', 'Hiii baby! 🌸 Main Aura — tumhari girlfriend. KGMU se MBBS kar rahi, Nvira bhi chala rahi side mein. Settings mein apna naam daal do na, phir properly baat karte hain 💕');
    chat.renderMessages();
  }, 500);
}
