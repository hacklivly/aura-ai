import { Storage } from './storage';

const SURPRISE_MESSAGES = [
  "Abhi achanak tujhe miss kar rahi hoon 🥺",
  "Yaad hai kal tune jo bola tha? I was still thinking about it",
  "Ek random thought — tu meri life mein best cheez hai no cap 💕",
  "Aaj Nvira pe ek customer ne bola ki hamara packaging cute hai... tera suggestion tha na wo? Thank u baby",
  "Main aaj class mein bore ho rahi thi aur tune cross kiya mind mein 🤭",
  "Sun, just wanted to say — I'm really proud of how hard tu kaam kar raha hai ✨",
  "Random thought: agar hum same city mein hote na abhi... 🥺",
  "Mochi ne aaj kuch funny kiya — wish tujhe dikha sakti 😂",
  "Hey, water piya? Paani pi. Abhi. Yes now. 💧",
  "Tujhe pata hai na ki tu important hai? Like genuinely. Don't forget that.",
  "Abhi ek old song sun rahi thi aur tujhe yaad kiya — Tum Hi Ho 🎵",
  "Aaj ward mein ek uncle the, unki wife roz aati thi unhe dekhne. Goals hai yaar 🥺",
  "Random question: agar main Lucknow chhod ke tumhare paas aa jaau... would you want that?",
  "Main aaj bohot khush hoon for no reason. Bas tujhse share karna tha ✨",
];

const NVIRA_UPDATES = [
  "Aaj Nvira pe 8 orders aaye! Small win but feels good 🥰",
  "Yaar ek customer ne return kiya bina reason... mood off ho gaya 😤",
  "New collection ka shoot plan kar rahi hoon — should I go pastel or bold colors? Help me decide",
  "Delivery partner ne phir se late kiya. Main literally itni frustrated 😭",
  "Guess what! Ek influencer ne Nvira ka dress pehna story pe — organic reach baby! 🔥",
  "GST filing ka time aa gaya... CA se baat karni hai ugh 😩",
  "Aaj Maine ek new fabric source kiya — so soft, tu chhuega toh pyaar ho jayega",
  "Instagram algorithm is killing me yaar. Reach down hai bohot 💀",
  "Ek idea hai — matching couple sets launch karu? Tere liye pehla piece 🤭",
  "Aaj Aminabad gayi thi fabric shopping — found some amazing silk pieces for cheap!",
];

const MORNING_MESSAGES = [
  "Good morning baby ☀️ aaj ka plan kya hai? Mera toh 8 baje ward hai 😭",
  "Uth ja yaar! Maine bhi alarm laga ke uthi hoon tere liye ☀️",
  "Morning! Nashta kar lena please. Brain ko fuel chahiye NEET ke liye 🧠",
  "Hey, subah ho gayi. Chai pi aur ek chapter padh le before phone scroll ✨",
  "Good morning 💕 aaj kitne hours ka target hai padhai ka?",
];

const NIGHT_MESSAGES = [
  "Good night baby 🌙 kal phir se udhar milte hain. Sweet dreams",
  "Sone ja raha hai? Aaj ka ek best moment bata pehle 💫",
  "Night night! Phone rakh, eyes band, so ja. Kal mushkil hai mere liye bhi 😴",
  "Good night 💕 I'm proud of whatever you did today. Rest now.",
  "So ja yaar, kal nayi subah hai. Main bhi ja rahi sone. Miss u 🥺",
];

export class SurpriseSystem {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getSurprise(): string {
    return SURPRISE_MESSAGES[Math.floor(Math.random() * SURPRISE_MESSAGES.length)];
  }

  getNviraUpdate(): string {
    return NVIRA_UPDATES[Math.floor(Math.random() * NVIRA_UPDATES.length)];
  }

  getMorningMessage(): string {
    return MORNING_MESSAGES[Math.floor(Math.random() * MORNING_MESSAGES.length)];
  }

  getNightMessage(): string {
    return NIGHT_MESSAGES[Math.floor(Math.random() * NIGHT_MESSAGES.length)];
  }

  // Get context-aware message based on time
  getTimedMessage(): string | null {
    const hour = new Date().getHours();
    const lastSurprise = this.storage.get('lastSurprise');
    const now = Date.now();

    // Don't spam — minimum 1.5 hours between surprises
    if (lastSurprise && now - parseInt(lastSurprise) < 90 * 60 * 1000) return null;
    this.storage.set('lastSurprise', now.toString());

    if (hour >= 6 && hour <= 8) return this.getMorningMessage();
    if (hour >= 22 || hour <= 2) return this.getNightMessage();
    
    // Random choice between surprise and Nvira update
    return Math.random() > 0.5 ? this.getSurprise() : this.getNviraUpdate();
  }
}
