export interface ICQEmoji {
  id: string;
  name: string;
  file: string;
}

const UNICODE_TO_ICQ: Record<string, string> = {};

export function getICQEmojiPath(emojiId: string, theme: 'light' | 'dark'): string {
  const skin = theme === 'dark' ? 'hd_dark_skin' : 'hd_light_skin';
  return `/ICQ/${skin}/${emojiId}.gif`;
}

export function getICQStickerPath(stickerId: string): string {
  return `/stickers/caveman/${stickerId}.png`;
}

export function getRACOONStickerPath(stickerId: string): string {
  return `/stickers/raccoon/${stickerId}.png`;
}

export function getICQStickerSrc(sticker: string, theme: 'light' | 'dark'): string | null {
  if (!sticker) return null;
  if (sticker.startsWith('icq:')) return getICQEmojiPath(sticker.slice(4), theme);
  if (sticker.startsWith('caveman:')) return getICQStickerPath(sticker.slice(8));
  if (sticker.startsWith('raccoon:')) return getRACOONStickerPath(sticker.slice(8));
  const icqId = UNICODE_TO_ICQ[sticker];
  return icqId ? getICQEmojiPath(icqId, theme) : null;
}

export function getICQEmojiUrl(emoji: ICQEmoji, theme: 'light' | 'dark'): string {
  return getICQEmojiPath(emoji.file.replace('.gif', ''), theme);
}

export const ICQ_EMOJI_MAP: ICQEmoji[] = [
  { id: "acute", name: "Acute", file: "acute.gif" },
  { id: "aggressive", name: "Aggressive", file: "aggressive.gif" },
  { id: "air_kiss", name: "Air kiss", file: "air_kiss.gif" },
  { id: "angel", name: "Angel", file: "angel.gif" },
  { id: "bad", name: "Bad", file: "bad.gif" },
  { id: "bb", name: "Bb", file: "bb.gif" },
  { id: "beach", name: "Beach", file: "beach.gif" },
  { id: "beee", name: "Beee", file: "beee.gif" },
  { id: "big_boss", name: "Big boss", file: "big_boss.gif" },
  { id: "biggrin", name: "Biggrin", file: "biggrin.gif" },
  { id: "blum2", name: "Blum2", file: "blum2.gif" },
  { id: "blush", name: "Blush", file: "blush.gif" },
  { id: "boast", name: "Boast", file: "boast.gif" },
  { id: "bomb", name: "Bomb", file: "bomb.gif" },
  { id: "boredom", name: "Boredom", file: "boredom.gif" },
  { id: "bye", name: "Bye", file: "bye.gif" },
  { id: "clapping", name: "Clapping", file: "clapping.gif" },
  { id: "cray", name: "Cray", file: "cray.gif" },
  { id: "crazy", name: "Crazy", file: "crazy.gif" },
  { id: "curtsey", name: "Curtsey", file: "curtsey.gif" },
  { id: "dance4", name: "Dance4", file: "dance4.gif" },
  { id: "dash1", name: "Dash1", file: "dash1.gif" },
  { id: "dirol", name: "Dirol", file: "dirol.gif" },
  { id: "drinks", name: "Drinks", file: "drinks.gif" },
  { id: "feminist", name: "Feminist", file: "feminist.gif" },
  { id: "flirt", name: "Flirt", file: "flirt.gif" },
  { id: "focus", name: "Focus", file: "focus.gif" },
  { id: "fool", name: "Fool", file: "fool.gif" },
  { id: "friends", name: "Friends", file: "friends.gif" },
  { id: "gamer4", name: "Gamer4", file: "gamer4.gif" },
  { id: "girl_cray2", name: "Girl cray2", file: "girl_cray2.gif" },
  { id: "girl_crazy", name: "Girl crazy", file: "girl_crazy.gif" },
  { id: "girl_drink4", name: "Girl drink4", file: "girl_drink4.gif" },
  { id: "girl_haha", name: "Girl haha", file: "girl_haha.gif" },
  { id: "girl_hospital", name: "Girl hospital", file: "girl_hospital.gif" },
  { id: "girl_impossible", name: "Girl impossible", file: "girl_impossible.gif" },
  { id: "girl_in_love", name: "Girl in love", file: "girl_in_love.gif" },
  { id: "girl_sigh", name: "Girl sigh", file: "girl_sigh.gif" },
  { id: "give_heart2", name: "Give heart2", file: "give_heart2.gif" },
  { id: "give_rose", name: "Give rose", file: "give_rose.gif" },
  { id: "good", name: "Good", file: "good.gif" },
  { id: "heart", name: "Heart", file: "heart.gif" },
  { id: "help", name: "Help", file: "help.gif" },
  { id: "hi", name: "Hi", file: "hi.gif" },
  { id: "hunter", name: "Hunter", file: "hunter.gif" },
  { id: "hysteric", name: "Hysteric", file: "hysteric.gif" },
  { id: "i-m_so_happy", name: "I-m so happy", file: "i-m_so_happy.gif" },
  { id: "ireful1", name: "Ireful1", file: "ireful1.gif" },
  { id: "king", name: "King", file: "king.gif" },
  { id: "kiss2", name: "Kiss2", file: "kiss2.gif" },
  { id: "kiss3", name: "Kiss3", file: "kiss3.gif" },
  { id: "lazy", name: "Lazy", file: "lazy.gif" },
  { id: "lol", name: "Lol", file: "lol.gif" },
  { id: "mail1", name: "Mail1", file: "mail1.gif" },
  { id: "mamba", name: "Mamba", file: "mamba.gif" },
  { id: "mega_shock", name: "Mega shock", file: "mega_shock.gif" },
  { id: "mocking", name: "Mocking", file: "mocking.gif" },
  { id: "moil", name: "Moil", file: "moil.gif" },
  { id: "music", name: "Music", file: "music.gif" },
  { id: "nea", name: "Nea", file: "nea.gif" },
  { id: "new_russian", name: "New russian", file: "new_russian.gif" },
  { id: "ok", name: "Ok", file: "ok.gif" },
  { id: "paint2", name: "Paint2", file: "paint2.gif" },
  { id: "pardon", name: "Pardon", file: "pardon.gif" },
  { id: "party2", name: "Party2", file: "party2.gif" },
  { id: "pleasantry", name: "Pleasantry", file: "pleasantry.gif" },
  { id: "popcorn1", name: "Popcorn1", file: "popcorn1.gif" },
  { id: "prankster2", name: "Prankster2", file: "prankster2.gif" },
  { id: "preved", name: "Preved", file: "preved.gif" },
  { id: "punish", name: "Punish", file: "punish.gif" },
  { id: "rofl", name: "Rofl", file: "rofl.gif" },
  { id: "sad", name: "Sad", file: "sad.gif" },
  { id: "sarcastic", name: "Sarcastic", file: "sarcastic.gif" },
  { id: "scare", name: "Scare", file: "scare.gif" },
  { id: "scratch_one-s_head", name: "Scratch one-s head", file: "scratch_one-s_head.gif" },
  { id: "search", name: "Search", file: "search.gif" },
  { id: "secret", name: "Secret", file: "secret.gif" },
  { id: "shock", name: "Shock", file: "shock.gif" },
  { id: "shout", name: "Shout", file: "shout.gif" },
  { id: "slow", name: "Slow", file: "slow.gif" },
  { id: "smile", name: "Smile", file: "smile.gif" },
  { id: "smoke", name: "Smoke", file: "smoke.gif" },
  { id: "sorry2", name: "Sorry2", file: "sorry2.gif" },
  { id: "spiteful", name: "Spiteful", file: "spiteful.gif" },
  { id: "spruce_up", name: "Spruce up", file: "spruce_up.gif" },
  { id: "stop", name: "Stop", file: "stop.gif" },
  { id: "tease", name: "Tease", file: "tease.gif" },
  { id: "tender", name: "Tender", file: "tender.gif" },
  { id: "thank_you2", name: "Thank you2", file: "thank_you2.gif" },
  { id: "this", name: "This", file: "this.gif" },
  { id: "training1", name: "Training1", file: "training1.gif" },
  { id: "unknown", name: "Unknown", file: "unknown.gif" },
  { id: "vampire", name: "Vampire", file: "vampire.gif" },
  { id: "vava", name: "Vava", file: "vava.gif" },
  { id: "victory", name: "Victory", file: "victory.gif" },
  { id: "wacko2", name: "Wacko2", file: "wacko2.gif" },
  { id: "wink", name: "Wink", file: "wink.gif" },
  { id: "wizard", name: "Wizard", file: "wizard.gif" },
  { id: "yahoo", name: "Yahoo", file: "yahoo.gif" },
  { id: "yes3", name: "Yes3", file: "yes3.gif" },
  { id: "yess", name: "Yess", file: "yess.gif" },
];

export const CAVEMAN_STICKERS: ICQEmoji[] = [
  { id: "caveman-train", name: "Train", file: "caveman-train.png" },
  { id: "caveman-wave-hi", name: "Wave Hi", file: "caveman-wave-hi.png" },
  { id: "caveman-exhausted", name: "Exhausted", file: "caveman-exhausted.png" },
  { id: "caveman-thinking", name: "Thinking", file: "caveman-thinking.png" },
  { id: "caveman-proud", name: "Proud", file: "caveman-proud.png" },
  { id: "caveman-scared", name: "Scared", file: "caveman-scared.png" },
  { id: "caveman-santa", name: "Santa", file: "caveman-santa.png" },
  { id: "caveman-unicorn", name: "Unicorn", file: "caveman-unicorn.png" },
  { id: "caveman-artist", name: "Artist", file: "caveman-artist.png" },
  { id: "caveman-galactic", name: "Galactic", file: "caveman-galactic.png" },
  { id: "caveman-music", name: "Music", file: "caveman-music.png" },
  { id: "caveman-romantic", name: "Romantic", file: "caveman-romantic.png" },
  { id: "caveman-developer", name: "Developer", file: "caveman-developer.png" },
  { id: "caveman-inlove", name: "In Love", file: "caveman-inlove.png" },
  { id: "caveman-hungry", name: "Hungry", file: "caveman-hungry.png" },
  { id: "caveman-hug", name: "Hug", file: "caveman-hug.png" },
  { id: "caveman-electric-shock", name: "Electric Shock", file: "caveman-electric-shock.png" },
  { id: "caveman-dance", name: "Dance", file: "caveman-dance.png" },
  { id: "caveman-curious", name: "Curious", file: "caveman-curious.png" },
  { id: "caveman-holiday", name: "Holiday", file: "caveman-holiday.png" },
  { id: "caveman-spa", name: "Spa", file: "caveman-spa.png" },
  { id: "caveman-angry", name: "Angry", file: "caveman-angry.png" },
  { id: "caveman-chicken", name: "Chicken", file: "caveman-chicken.png" },
];

export const RACOON_STICKERS: ICQEmoji[] = [
  { id: "racoon-workout2", name: "Workout 2", file: "racoon-workout2.png" },
  { id: "racoon-summer", name: "Summer", file: "racoon-summer.png" },
  { id: "racoon-goal", name: "Goal", file: "racoon-goal.png" },
  { id: "racoon-tired", name: "Tired", file: "racoon-tired.png" },
  { id: "racoon-surprise", name: "Surprise", file: "racoon-surprise.png" },
  { id: "racoon-beach", name: "Beach", file: "racoon-beach.png" },
  { id: "racoon-sick", name: "Sick", file: "racoon-sick.png" },
  { id: "racoon-shopping", name: "Shopping", file: "racoon-shopping.png" },
  { id: "racoon-selfie", name: "Selfie", file: "racoon-selfie.png" },
  { id: "racoon-rockstar", name: "Rockstar", file: "racoon-rockstar.png" },
  { id: "racoon-vacation", name: "Vacation", file: "racoon-vacation.png" },
  { id: "racoon-read", name: "Read", file: "racoon-read.png" },
  { id: "racoon-meditation", name: "Meditation", file: "racoon-meditation.png" },
  { id: "racoon-question", name: "Question", file: "racoon-question.png" },
  { id: "racoon-mind-blown", name: "Mind Blown", file: "racoon-mind-blown.png" },
  { id: "racoon-food", name: "Food", file: "racoon-food.png" },
  { id: "racoon-warrior", name: "Warrior", file: "racoon-warrior.png" },
  { id: "racoon-insect", name: "Insect", file: "racoon-insect.png" },
  { id: "racoon-workout", name: "Workout", file: "racoon-workout.png" },
  { id: "racoon-throne", name: "Throne", file: "racoon-throne.png" },
  { id: "racoon-idea", name: "Idea", file: "racoon-idea.png" },
  { id: "racoon-hug", name: "Hug", file: "racoon-hug.png" },
  { id: "racoon-happy", name: "Happy", file: "racoon-happy.png" },
  { id: "racoon-hacker", name: "Hacker", file: "racoon-hacker.png" },
  { id: "racoon-explosion", name: "Explosion", file: "racoon-explosion.png" },
  { id: "racoon-evil", name: "Evil", file: "racoon-evil.png" },
  { id: "racoon-coffee", name: "Coffee", file: "racoon-coffee.png" },
  { id: "racoon-experiment", name: "Experiment", file: "racoon-experiment.png" },
  { id: "racoon-cauldron", name: "Cauldron", file: "racoon-cauldron.png" },
  { id: "racoon-rich", name: "Rich", file: "racoon-rich.png" },
  { id: "racoon-fighter", name: "Fighter", file: "racoon-fighter.png" },
];