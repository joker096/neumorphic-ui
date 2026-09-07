import React from "react";
import { Search } from "lucide-react";

type Emoji = { e: string; n: string; cat: string; tone?: boolean };

const CATS: { key: string; label: string }[] = [
  { key: "smileys", label: "Smileys" },
  { key: "people", label: "People" },
  { key: "animals", label: "Animals" },
  { key: "food", label: "Food" },
  { key: "activities", label: "Activities" },
  { key: "travel", label: "Travel" },
  { key: "objects", label: "Objects" },
  { key: "symbols", label: "Symbols" },
  { key: "flags", label: "Flags" },
];

const TONES = ["", "🏻", "🏼", "🏽", "🏾", "🏿"];

const DATA: Emoji[] = [
  { e: "😀", n: "grin", cat: "smileys" }, { e: "😃", n: "smile", cat: "smileys" }, { e: "😄", n: "happy", cat: "smileys" }, { e: "😁", n: "laugh", cat: "smileys" }, { e: "😆", n: "laughing", cat: "smileys" }, { e: "😅", n: "sweat", cat: "smileys" }, { e: "🤣", n: "rofl", cat: "smileys" }, { e: "😂", n: "joy", cat: "smileys" }, { e: "🙂", n: "slight", cat: "smileys" }, { e: "🙃", n: "upside", cat: "smileys" }, { e: "😉", n: "wink", cat: "smileys" }, { e: "😊", n: "blush", cat: "smileys" }, { e: "😇", n: "angel", cat: "smileys" }, { e: "🥰", n: "love", cat: "smileys" }, { e: "😍", n: "heart", cat: "smileys" }, { e: "🤩", n: "star", cat: "smileys" }, { e: "😘", n: "kiss", cat: "smileys" }, { e: "🤔", n: "think", cat: "smileys" }, { e: "🤨", n: "raise", cat: "smileys" }, { e: "😐", n: "neutral", cat: "smileys" }, { e: "😴", n: "sleep", cat: "smileys" }, { e: "😎", n: "cool", cat: "smileys" }, { e: "🥳", n: "party", cat: "smileys" }, { e: "😢", n: "cry", cat: "smileys" }, { e: "😭", n: "sob", cat: "smileys" }, { e: "😡", n: "angry", cat: "smileys" }, { e: "🤯", n: "mind", cat: "smileys" }, { e: "🥶", n: "cold", cat: "smileys" }, { e: "🥵", n: "hot", cat: "smileys" }, { e: "🤒", n: "sick", cat: "smileys" },
  { e: "👋", n: "wave", cat: "people", tone: true }, { e: "🙏", n: "pray", cat: "people", tone: true }, { e: "🤝", n: "shake", cat: "people", tone: true }, { e: "👌", n: "ok", cat: "people", tone: true }, { e: "👍", n: "thumbsup", cat: "people", tone: true }, { e: "👎", n: "thumbsdown", cat: "people", tone: true }, { e: "✌️", n: "victory", cat: "people", tone: true }, { e: "🤘", n: "rock", cat: "people", tone: true }, { e: "🤙", n: "call", cat: "people", tone: true }, { e: "👈", n: "left", cat: "people", tone: true }, { e: "👉", n: "right", cat: "people", tone: true }, { e: "👆", n: "up", cat: "people", tone: true }, { e: "👇", n: "down", cat: "people", tone: true }, { e: "☝️", n: "index", cat: "people", tone: true }, { e: "✋", n: "hand", cat: "people", tone: true }, { e: "💪", n: "strong", cat: "people", tone: true }, { e: "🤏", n: "pinch", cat: "people", tone: true }, { e: "🫶", n: "hearthand", cat: "people", tone: true }, { e: "🫡", n: "salute", cat: "people", tone: true }, { e: "🤌", n: "chef", cat: "people", tone: true }, { e: "🖐", n: "hand", cat: "people", tone: true }, { e: "✊", n: "fist", cat: "people", tone: true }, { e: "👏", n: "clap", cat: "people", tone: true },
  { e: "🐶", n: "dog", cat: "animals" }, { e: "🐱", n: "cat", cat: "animals" }, { e: "🐭", n: "mouse", cat: "animals" }, { e: "🐹", n: "hamster", cat: "animals" }, { e: "🐰", n: "rabbit", cat: "animals" }, { e: "🦊", n: "fox", cat: "animals" }, { e: "🐻", n: "bear", cat: "animals" }, { e: "🐼", n: "panda", cat: "animals" }, { e: "🐨", n: "koala", cat: "animals" }, { e: "🐯", n: "tiger", cat: "animals" }, { e: "🦁", n: "lion", cat: "animals" }, { e: "🐮", n: "cow", cat: "animals" }, { e: "🐷", n: "pig", cat: "animals" }, { e: "🐸", n: "frog", cat: "animals" }, { e: "🐵", n: "monkey", cat: "animals" }, { e: "🐔", n: "chicken", cat: "animals" }, { e: "🐧", n: "penguin", cat: "animals" }, { e: "🦄", n: "unicorn", cat: "animals" }, { e: "🐝", n: "bee", cat: "animals" }, { e: "🦋", n: "butterfly", cat: "animals" }, { e: "🐢", n: "turtle", cat: "animals" }, { e: "🐍", n: "snake", cat: "animals" }, { e: "🐙", n: "octopus", cat: "animals" }, { e: "🦖", n: "dino", cat: "animals" },
  { e: "🍎", n: "apple", cat: "food" }, { e: "🍌", n: "banana", cat: "food" }, { e: "🍓", n: "strawberry", cat: "food" }, { e: "🍇", n: "grape", cat: "food" }, { e: "🍉", n: "watermelon", cat: "food" }, { e: "🍑", n: "peach", cat: "food" }, { e: "🍒", n: "cherry", cat: "food" }, { e: "🍍", n: "pineapple", cat: "food" }, { e: "🥭", n: "mango", cat: "food" }, { e: "🍊", n: "orange", cat: "food" }, { e: "🍋", n: "lemon", cat: "food" }, { e: "🥕", n: "carrot", cat: "food" }, { e: "🌽", n: "corn", cat: "food" }, { e: "🍔", n: "burger", cat: "food" }, { e: "🍟", n: "fries", cat: "food" }, { e: "🍕", n: "pizza", cat: "food" }, { e: "🌭", n: "hotdog", cat: "food" }, { e: "🌮", n: "taco", cat: "food" }, { e: "🍜", n: "noodles", cat: "food" }, { e: "🍣", n: "sushi", cat: "food" }, { e: "🍩", n: "donut", cat: "food" }, { e: "🍪", n: "cookie", cat: "food" }, { e: "🎂", n: "cake", cat: "food" }, { e: "🍫", n: "chocolate", cat: "food" }, { e: "☕", n: "coffee", cat: "food" }, { e: "🍺", n: "beer", cat: "food" }, { e: "🍷", n: "wine", cat: "food" }, { e: "🥤", n: "soda", cat: "food" },
  { e: "⚽", n: "soccer", cat: "activities" }, { e: "🏀", n: "basketball", cat: "activities" }, { e: "🏈", n: "football", cat: "activities" }, { e: "⚾", n: "baseball", cat: "activities" }, { e: "🎾", n: "tennis", cat: "activities" }, { e: "🏐", n: "volleyball", cat: "activities" }, { e: "🎱", n: "pool", cat: "activities" }, { e: "🏓", n: "pingpong", cat: "activities" }, { e: "🏸", n: "badminton", cat: "activities" }, { e: "🥊", n: "box", cat: "activities" }, { e: "🥋", n: "martial", cat: "activities" }, { e: "🎽", n: "running", cat: "activities" }, { e: "⛸", n: "skate", cat: "activities" }, { e: "🛹", n: "skateboard", cat: "activities" }, { e: "🎿", n: "ski", cat: "activities" }, { e: "🏂", n: "snowboard", cat: "activities" }, { e: "🏊", n: "swim", cat: "activities" }, { e: "🚴", n: "cycle", cat: "activities" }, { e: "🏋️", n: "gym", cat: "activities" }, { e: "🤸", n: "gymnast", cat: "activities" }, { e: "🧘", n: "yoga", cat: "activities" }, { e: "🏆", n: "trophy", cat: "activities" }, { e: "🎯", n: "target", cat: "activities" }, { e: "🎲", n: "dice", cat: "activities" }, { e: "🎮", n: "game", cat: "activities" },
  { e: "🚗", n: "car", cat: "travel" }, { e: "🚕", n: "taxi", cat: "travel" }, { e: "🚌", n: "bus", cat: "travel" }, { e: "🏎", n: "racecar", cat: "travel" }, { e: "🚓", n: "police", cat: "travel" }, { e: "🚑", n: "ambulance", cat: "travel" }, { e: "🚒", n: "firetruck", cat: "travel" }, { e: "✈️", n: "plane", cat: "travel" }, { e: "🚀", n: "rocket", cat: "travel" }, { e: "🚁", n: "helicopter", cat: "travel" }, { e: "⛵", n: "sailboat", cat: "travel" }, { e: "🚤", n: "boat", cat: "travel" }, { e: "🚂", n: "train", cat: "travel" }, { e: "🚊", n: "tram", cat: "travel" }, { e: "🏍", n: "motorcycle", cat: "travel" }, { e: "🚲", n: "bike", cat: "travel" }, { e: "🛴", n: "scooter", cat: "travel" }, { e: "🏝", n: "island", cat: "travel" }, { e: "🗺", n: "map", cat: "travel" }, { e: "🧭", n: "compass", cat: "travel" }, { e: "🏔", n: "mountain", cat: "travel" }, { e: "🌋", n: "volcano", cat: "travel" }, { e: "🏕", n: "camping", cat: "travel" }, { e: "🏖", n: "beach", cat: "travel" }, { e: "🌃", n: "city", cat: "travel" }, { e: "🌉", n: "bridge", cat: "travel" },
  { e: "⌚", n: "watch", cat: "objects" }, { e: "📱", n: "phone", cat: "objects" }, { e: "💻", n: "laptop", cat: "objects" }, { e: "⌨️", n: "keyboard", cat: "objects" }, { e: "🖥", n: "desktop", cat: "objects" }, { e: "🖨", n: "printer", cat: "objects" }, { e: "💡", n: "bulb", cat: "objects" }, { e: "🔦", n: "flashlight", cat: "objects" }, { e: "📷", n: "camera", cat: "objects" }, { e: "🎥", n: "movie", cat: "objects" }, { e: "📺", n: "tv", cat: "objects" }, { e: "📻", n: "radio", cat: "objects" }, { e: "🎙", n: "mic", cat: "objects" }, { e: "🔋", n: "battery", cat: "objects" }, { e: "🔌", n: "plug", cat: "objects" }, { e: "🔑", n: "key", cat: "objects" }, { e: "🔒", n: "lock", cat: "objects" }, { e: "🔓", n: "unlock", cat: "objects" }, { e: "📦", n: "box", cat: "objects" }, { e: "✉️", n: "envelope", cat: "objects" }, { e: "📝", n: "memo", cat: "objects" }, { e: "📚", n: "books", cat: "objects" }, { e: "📖", n: "book", cat: "objects" }, { e: "🔧", n: "wrench", cat: "objects" }, { e: "⚙️", n: "gear", cat: "objects" }, { e: "🧲", n: "magnet", cat: "objects" }, { e: "💰", n: "money", cat: "objects" }, { e: "💎", n: "gem", cat: "objects" }, { e: "🛒", n: "cart", cat: "objects" },
  { e: "❤️", n: "heart", cat: "symbols" }, { e: "🧡", n: "orange", cat: "symbols" }, { e: "💛", n: "yellow", cat: "symbols" }, { e: "💚", n: "green", cat: "symbols" }, { e: "💙", n: "blue", cat: "symbols" }, { e: "💜", n: "purple", cat: "symbols" }, { e: "🖤", n: "black", cat: "symbols" }, { e: "🤍", n: "white", cat: "symbols" }, { e: "💔", n: "broken", cat: "symbols" }, { e: "💕", n: "twohearts", cat: "symbols" }, { e: "💖", n: "sparkling", cat: "symbols" }, { e: "✨", n: "sparkles", cat: "symbols" }, { e: "⭐", n: "star", cat: "symbols" }, { e: "🌟", n: "glowstar", cat: "symbols" }, { e: "⚡", n: "bolt", cat: "symbols" }, { e: "🔥", n: "fire", cat: "symbols" }, { e: "🌈", n: "rainbow", cat: "symbols" }, { e: "☀️", n: "sun", cat: "symbols" }, { e: "🌙", n: "moon", cat: "symbols" }, { e: "☁️", n: "cloud", cat: "symbols" }, { e: "🌧", n: "rain", cat: "symbols" }, { e: "❄️", n: "snow", cat: "symbols" }, { e: "💯", n: "hundred", cat: "symbols" }, { e: "✅", n: "check", cat: "symbols" }, { e: "❌", n: "cross", cat: "symbols" }, { e: "⚠️", n: "warning", cat: "symbols" }, { e: "❓", n: "question", cat: "symbols" }, { e: "💬", n: "speech", cat: "symbols" }, { e: "🔔", n: "bell", cat: "symbols" }, { e: "🔕", n: "mute", cat: "symbols" },
  { e: "🏁", n: "checkered", cat: "flags" }, { e: "🚩", n: "flag", cat: "flags" }, { e: "🎌", n: "japan", cat: "flags" }, { e: "🏴", n: "black", cat: "flags" }, { e: "🏳️", n: "white", cat: "flags" }, { e: "🏴‍☠️", n: "pirate", cat: "flags" }, { e: "🇷🇺", n: "ru", cat: "flags" }, { e: "🇺🇸", n: "us", cat: "flags" }, { e: "🇬🇧", n: "gb", cat: "flags" }, { e: "🇩🇪", n: "de", cat: "flags" }, { e: "🇫🇷", n: "fr", cat: "flags" }, { e: "🇪🇸", n: "es", cat: "flags" }, { e: "🇨🇳", n: "cn", cat: "flags" }, { e: "🇯🇵", n: "jp", cat: "flags" }, { e: "🇰🇷", n: "kr", cat: "flags" }, { e: "🇮🇹", n: "it", cat: "flags" }, { e: "🇧🇷", n: "br", cat: "flags" }, { e: "🇮🇳", n: "in", cat: "flags" }, { e: "🇨🇦", n: "ca", cat: "flags" }, { e: "🇦🇺", n: "au", cat: "flags" }, { e: "🇺🇦", n: "ua", cat: "flags" },
];

const RECENT_KEY = "emojiRecent";
const COLS = 9;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface EmojiPickerProps {
  theme: "light" | "dark";
  t: (key: string, opts?: any) => string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ theme, t, onSelect, onClose }: EmojiPickerProps) {
  const [query, setQuery] = React.useState("");
  const [tone, setTone] = React.useState(0);
  const [recent, setRecent] = React.useState<string[]>(() => loadRecent());
  const [activeCat, setActiveCat] = React.useState<string>(() => (loadRecent().length ? "recent" : "smileys"));
  const btnRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const firstRender = React.useRef(true);

  const isDark = theme === "dark";

  const display = (e: Emoji) => (tone > 0 && e.tone ? e.e + TONES[tone] : e.e);

  const visible: Emoji[] = React.useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return DATA.filter((d) => d.n.toLowerCase().includes(q));
    }
    if (activeCat === "recent") {
      const set = new Set(recent);
      const recents = DATA.filter((d) => set.has(d.e));
      const map = new Map(recent.map((r, i) => [r, i]));
      return recents.sort((a, b) => (map.get(a.e)! - map.get(b.e)!));
    }
    return DATA.filter((d) => d.cat === activeCat);
  }, [query, activeCat, recent]);

  const pick = (e: Emoji) => {
    const val = display(e);
    const next = [e.e, ...recent.filter((r) => r !== e.e)].slice(0, 32);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    onSelect(val);
  };

  const onGridKey = (e: React.KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === "ArrowRight") next = Math.min(visible.length - 1, idx + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, idx - 1);
    else if (e.key === "ArrowDown") next = Math.min(visible.length - 1, idx + COLS);
    else if (e.key === "ArrowUp") next = Math.max(0, idx - COLS);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(visible[idx]);
      return;
    } else if (e.key === "Escape") {
      onClose();
      return;
    } else return;
    e.preventDefault();
    btnRefs.current[next]?.focus();
  };

  const tabBar = (
    <div className="flex gap-1 overflow-x-auto pb-1 mb-1 border-b border-black/10 dark:border-white/10">
      <button
        type="button"
        onClick={() => { setQuery(""); setActiveCat("recent"); }}
        className={`px-2 py-1 rounded-lg text-[12px] whitespace-nowrap ${activeCat === "recent" ? "bg-[var(--accent)] text-white" : isDark ? "text-gray-300 hover:bg-white/10" : "text-slate-600 hover:bg-black/5"}`}
      >
        {t("emojis.recent", "Recent")}
      </button>
      {CATS.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => { setQuery(""); setActiveCat(c.key); }}
          className={`px-2 py-1 rounded-lg text-[12px] whitespace-nowrap ${activeCat === c.key ? "bg-[var(--accent)] text-white" : isDark ? "text-gray-300 hover:bg-white/10" : "text-slate-600 hover:bg-black/5"}`}
        >
          {t(`emojis.cat.${c.key}`, c.label)}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className={`w-full max-w-[340px] rounded-2xl p-2 ${isDark ? "bg-[var(--bg-secondary)] text-gray-100" : "bg-white text-slate-800"} shadow-xl border border-black/5`}
      role="dialog"
      aria-label={t("emojis.title", "Emoji")}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("emojis.search", "Search")}
            aria-label={t("emojis.search", "Search")}
            className="w-full pl-8 pr-2 py-1.5 rounded-lg text-[13px] bg-black/5 dark:bg-white/10 outline-none border-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 mb-2" aria-label={t("emojis.skinTone", "Skin tone")}>
        <span className="text-[11px] opacity-60 mr-1">{t("emojis.skinTone", "Skin tone")}:</span>
        {TONES.map((tn, i) => (
          <button
            key={i}
            type="button"
            aria-label={tn || t("emojis.skinDefault", "Default")}
            onClick={() => setTone(i)}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[14px] ${tone === i ? "ring-2 ring-[var(--accent)]" : ""} ${i === 0 ? (isDark ? "bg-white/20" : "bg-black/10") : "bg-[#f5cba7]"}`}
          >
            {tn || "🙂"}
          </button>
        ))}
      </div>

      {tabBar}

      <div
        className="grid gap-0.5 max-h-[220px] overflow-y-auto pr-1"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {visible.map((e, i) => (
          <button
            key={e.e + i}
            ref={(el) => { btnRefs.current[i] = el; }}
            type="button"
            title={e.n}
            aria-label={e.n}
            onClick={() => pick(e)}
            onKeyDown={(ev) => onGridKey(ev, i)}
            className="aspect-square flex items-center justify-center text-[18px] rounded-lg hover:bg-[var(--accent)]/20 focus:bg-[var(--accent)]/30 focus:outline-none"
          >
            {display(e)}
          </button>
        ))}
        {visible.length === 0 && (
          <div className="col-span-full py-6 text-center text-[12px] opacity-50">{t("emojis.none", "No results")}</div>
        )}
      </div>
    </div>
  );
}
