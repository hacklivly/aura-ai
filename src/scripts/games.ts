import { Storage } from './storage';

const TRUTHS = [
  "Meri ek baat batao jo tumne kisi ko nahi batai",
  "Last time kab roya tha? Aur kyun?",
  "Mere baare mein pehli impression kya thi?",
  "Agar ek din ke liye invisible ho jaao toh kya karoge?",
  "Tumhari sabse embarrassing moment kya hai?",
  "Kya tum kabhi mere baare mein jealous feel karte ho?",
  "Ek secret guilty pleasure batao",
  "Agar time travel kar sake toh kahan jaoge?",
  "Tumne last lie kab bola tha aur kya tha?",
  "Mere baare mein ek cheez jo change karna chahte ho?",
];

const DARES = [
  "Abhi apna selfie bhejo mujhe — no filter allowed 📸",
  "Next 1 hour sirf Hindi mein baat karo, no English",
  "Apni playlist ka sabse embarrassing song bhejo",
  "Mujhe ek poem likho — 4 lines, abhi turant",
  "Abhi uthke 10 jumping jacks karo aur mujhe bolo done",
  "Apna last screenshot bhejo (if safe 😂)",
  "Ek cheez bolo jo tum mujhe kabhi nahi bologe normally",
  "Next person jo tumhe text kare usko 'I love you' bhejo",
];

const WOULD_YOU_RATHER = [
  "Would you rather: mujhse roz milna but 5 min ya hafte mein ek baar full day?",
  "WYR: never eat pizza again ya never eat biryani again?",
  "WYR: time travel to past ya future?",
  "WYR: be invisible ya fly kar sakein?",
  "WYR: always know when someone is lying ya always get away with lying?",
  "WYR: live in mountains ya beach pe?",
  "WYR: no phone for 1 month ya no meeting me for 3 months?",
  "WYR: be famous ya be rich (but unknown)?",
  "WYR: read minds ya control time?",
  "WYR: relive the best day of your life ya erase the worst?",
];

const RAPID_FIRE = [
  "Fav color?", "Chai ya coffee?", "Morning person ya night owl?",
  "Cats ya dogs?", "Mountains ya beaches?", "Call ya text?",
  "Sweet ya spicy?", "Summer ya winter?", "Books ya movies?",
  "Introvert ya extrovert?", "Early bird ya late night?", "Rain ya sunshine?",
  "Pizza ya burger?", "Bollywood ya Hollywood?", "Instagram ya YouTube?",
  "Meri best quality?", "Meri worst habit?", "Song jo abhi dimag mein hai?",
];

export class CoupleGames {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getTruth(): string { return TRUTHS[Math.floor(Math.random() * TRUTHS.length)]; }
  getDare(): string { return DARES[Math.floor(Math.random() * DARES.length)]; }
  getWouldYouRather(): string { return WOULD_YOU_RATHER[Math.floor(Math.random() * WOULD_YOU_RATHER.length)]; }
  getRapidFire(): string[] { 
    const shuffled = [...RAPID_FIRE].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }

  getRandomGame(): { type: string; content: string } {
    const games = [
      { type: 'truth', content: `Truth or dare? 🤭 Chalo truth — ${this.getTruth()}` },
      { type: 'dare', content: `Dare time! 😈 ${this.getDare()}` },
      { type: 'wyr', content: this.getWouldYouRather() },
      { type: 'rapid', content: `Rapid fire! ⚡ 5 sec mein answer — ${this.getRapidFire()[0]}` },
      { type: 'story', content: "Story game! 📖 Main start karti hoon: 'Ek raat ko jab sab so rahe the, achanak...' — ab tum aage badhao" },
    ];
    return games[Math.floor(Math.random() * games.length)];
  }
}
