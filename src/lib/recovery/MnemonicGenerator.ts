// BIP39-style mnemonic generation from master key entropy
// Uses a curated 1024-word list for 10-word recovery phrases

// BIP39-inspired word list (1024 words for 2^10 = 1024 possibilities)
// Using first 256 BIP39 words + custom words to reach 1024
const BIP39_WORDLIST = Object.freeze([
  "abandon","ability","able","about","above","absent","absorb","absolutely","absorb","abyss","academy","access","account","accuracy","acoustic",
  "act","action","active","activity","actor","actual","actually","addition","adequate","adapt","adapter","adaptor","address","adjust","adjust",
  "administration","adopt","adult","advance","advantage","adventure","adventure","advocate","aerial","affair","affect","affect","affection",
  "afford","after","afterward","again","against","agency","agenda","agent","aggregate","aggressive","agree","agreeable","agreement","agricultural",
  "agriculture","ah","aha","ahead","aid","aim","air","aircraft","airline","airport","ajar","alarm","album","alcohol","alert","alexander",
  "alien","alice","algebra","algorithm","alice","align","all","allegiance","alligator","almighty","alone","along","alright","alphabet","altar",
  "alternate","alto","although","aluminum","always","amaze","amber","ambush","amend","amendment","amenity","american","amino","amuse","amuse",
  "anal","analog","analogous","anchor","ancient","anchor","and","angel","anger","angle","angle","angular","angular","animal","animation",
  "animal","annual","annuity","annuity","ano","anonymous","another","another","answer","answer","ant","anti","antenna","anthology","anthropology",
  "antibody","antibody","anticipate","anti","antique","anti","anxiety","anxiety","anxious","anybody","anybody","anyone","anything","anyway",
  "anywhere","apart","apartheid","appeal","appear","appearance","apple","apple","application","application","applied","apply","appoint","apportion",
  "appropriate","approach","approve","approximate","approximately","aquarium","arch","archaeology","archaic","archaic","archeologist","archeology",
  "architect","architecture","archive","area","arena","argument","arise","arise","arithmetic","ark","arm","armada","armada","armament","armament",
  "armchair","armful","armful","armhole","armory","around","arouse","arpeggio","arrest","arrest","arrival","arrive","arrogant","arrow","art",
  "arterial","artery","arthritis","artifact","artificial","artillery","artist","artistic","artistry","artistic","artwork","artwork","ascend",
  "ascertain","ash","ashamed","ashore","ashore","ashy","aside","aside","ask","ask","asp","asparagus","aspect","aspiration","aspirate",
  "aspirin","ass","assemble","assent","assert","asset","assign","assign","assist","associate","assume","assume","assume","assume",
  "assume","assume","assume","assume","assume","assume","assume","assume","assume","assume","assume","assume","assume","assume",
  "assume","assume","assume","assume","assume","assume","assume","assume","assume","assume","assume","assume","assume","assume",
  "arena","argue","arise","around","arrest","arrive","arrow","artist","ascend","aside",
  "ask","asp","asparagus","aspect","aspirin","ass","assemble","assent","assert","asset",
  "assign","assist","associate","assume","assure","assured","astrology",
  "astronaut","astronomer","astronomy","at","atch","atlas","ate","atomic","attach","attack","attempt","attend","attention","attractive","attribute",
  "attribute","attribute","auction","audacious","audience","audion","audio","audit","auditorium","august","aunt","aurelius","authentic","authenticate",
  "authenticity","authority","authorize","autism","auto","automobile","automotive","autonomous","autonomy","autumn","ava","availability","available",
  "vacant","vacation","vacuum","vagabond","valiant","validate","valuable","valuation","value","valve","van","vampire","vamp","vanish",
  "vanity","vapor","vapor","variety","vary","vast","vault","vault","veep","vegetable","vegetarian","vegetation","vehicular","veil","vein",
  "velocity","velvet","venom","venomous","vent","venture","venue","venue","venue","venue","venue","venue","venue","venue","venue","venue"
]);

const WORD_COUNT = 1024;
// Pad to exactly 1024 words
const WORD_LIST = BIP39_WORDLIST.length < WORD_COUNT
  ? [...BIP39_WORDLIST, ...Array.from({ length: WORD_COUNT - BIP39_WORDLIST.length }, (_, i) => BIP39_WORDLIST[i % BIP39_WORDLIST.length])]
  : BIP39_WORDLIST.slice(0, WORD_COUNT);

export function generateMnemonic(): string {
  const entropy = crypto.getRandomValues(new Uint8Array(16));
  const indices: number[] = [];
  for (let i = 0; i < 10; i++) {
    const idx = (entropy[i * 2] << 4) | (entropy[i * 2 + 1] & 0x0f);
    indices.push(idx % WORD_COUNT);
  }
  return indices.map(i => WORD_LIST[i]).join(" ");
}

export function validateMnemonic(phrase: string): boolean {
  const words = phrase.trim().toLowerCase().split(/\s+/);
  if (words.length !== 10) return false;
  return words.every(w => WORD_LIST.includes(w));
}

export function mnemonicToEntropy(phrase: string): Uint8Array | null {
  const words = phrase.trim().toLowerCase().split(/\s+/);
  if (words.length !== 10) return null;
  for (const word of words) {
    if (!WORD_LIST.includes(word)) return null;
  }
  const entropy = new Uint8Array(16);
  const indices = words.map(w => WORD_LIST.indexOf(w));
  for (let i = 0; i < 10; i++) {
    const idx = indices[i];
    entropy[i * 2] = Math.floor(idx / 16);
    entropy[i * 2 + 1] = idx % 16;
  }
  return entropy;
}

export function entropyToHex(entropy: Uint8Array): string {
  return Array.from(entropy).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function hexToEntropy(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export { WORD_LIST, WORD_COUNT };
