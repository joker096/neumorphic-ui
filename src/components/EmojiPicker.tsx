import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useI18n } from '../lib/i18n';

const RECENT_KEY = 'emoji-recent';
const MAX_RECENT = 30;

const CATEGORIES = [
  { id: 'smileys', label: '😀', emojis: ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥴','😵','🤯','🤠','🥳','🥺','😢','😭','😤','😠','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'] },
  { id: 'gestures', label: '👋', emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄'] },
  { id: 'nature', label: '🌿', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🐓','🦃','🕊','🐇','🐁','🐀','🐿','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🎍','🍃','🍂','🍁','🍄','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐','🌟','✨','⚡','☄','💥','🔥','🌪','🌈','☀️','🌤','⛅','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄','🌬','💨','💧','💦','☔','☂','🌊','🌫'] },
  { id: 'food', label: '🍕', emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫐','🥐','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','☕','🫖','🍵','🍶','🍺','🍻','🥂','🍷','🫗','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽','🥣','🥡','🥢','🧂'] },
  { id: 'travel', label: '✈️', emojis: ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍','🛵','🛺','🚲','🛴','🛹','🚏','🛣','🛤','⛽','🛳','⛴','🛥','🚢','✈️','🛩','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰','🚀','🛸','🏠','🏡','🏘','🏚','🏗','🏢','🏭','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩','🕋','⛲','⛺','🌁','🌃','🏙','🌄','🌅','🌆','🌇','🌉','🗾','🏔','⛰','🌋','🗻','🏕','🏖','🏜','🏝','🏞'] },
  { id: 'activities', label: '⚽', emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛷','🛼','🛹','🎿','⛷','🏂','🪂','🏋','🤼','🤸','🤺','⛹','🤾','🏌','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🪕','🎻','🎲','♟','🎯','🎳','🎮','🕹','🎰','🧩'] },
  { id: 'objects', label: '💡', emojis: ['💡','🔦','🏮','🪔','📔','📕','📖','📗','📘','📙','📚','📓','📒','📃','📜','📄','📰','🗞','📑','🔖','🏷','💰','🪙','💴','💵','💶','💷','💸','💳','🧾','✉️','📧','📨','📩','📤','📥','📦','📫','📪','📬','📭','📮','🗳','✏️','✒️','🖋','🖊','🖌','🖍','📝','📁','📂','🗂','📅','📆','🗒','🗓','📇','📈','📉','📊','📋','📌','📍','📎','🖇','📏','📐','✂️','🗃','🗄','🗑','🔑','🗝','🔨','🪓','⛏','🪚','🔧','🪜','🛠','🗡','⚔','🔫','🪃','🏹','🛡','🔧','🔩','⚙','🗜','⚖','🦯','🔗','⛓','🪝','🧰','🧲','🪴','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🚪','🛏','🛋','🪑','🚽','🚿','🛁','🪞','🪟','🛠','🔧','🔨','🪚','🧹','🪣','🧽','🧴','🪥','🪒','🪤','🪬','🛎','🔑','🗝','🚪','🪟','🛏','🛋','🪑','🚽','🚿','🛁','🪞','🪥','🧹','🧺','🧻','🪣','🧴','🪒','🧽','🪥','🪣','🧹','🪤','🪬','🛎','🧿','🪩','🪆','📿','💎','🔮','🪄','🧿'] },
  { id: 'symbols', label: '❤️', emojis: ['❤','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣','💕','💞','💓','💗','💖','💘','💝','💟','☮','✝','☪','🕉','☸','✡','🔯','🕎','☯','☦','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛','🉑','☢','☣','📴','📳','🈶','🈚','🈸','🈺','🈷','✴','🆚','💮','🉐','㊙','㊗','🈴','🈵','🈲','🅰','🅱','🆎','🆑','🅾','🆘','❌','⭕','🛑','⛔','📛','🚫','💢','♨','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼','⁉','🔅','🔆','〽','⚠','🚸','🔱','⚜','🔰','♻','✅','🈯','💹','❇','✳','❎','🌐','💠','Ⓜ','🌀','💤','🏧','🚾','♿','🅿','🛗','🈳','🈂','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧','🚻','🚮','🎦','📶','🈁','🔣','🔤','🆕','🆓','ℹ','🆖','🆗','🆙','🆒','🆕','🆓','🆖','🆗','🆙','🆒','🆔','🆘','🔚','🔙','🔛','🔝','🔜','🛐','🕎','🔯','♾','🏳','🏴','🏁','🚩','🎌','🏴‍☠️','🇺🇳','🇺🇸','🇬🇧','🇨🇦','🇦🇺','🇯🇵','🇨🇳','🇰🇷','🇮🇳','🇧🇷','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇲🇽','🇷🇺','🇿🇦','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇳🇱','🇧🇪','🇨🇭','🇦🇹','🇵🇹','🇬🇷','🇵🇱','🇨🇿','🇭🇺','🇷🇴','🇺🇦','🇹🇷','🇸🇦','🇮🇱','🇪🇬','🇦🇷','🇨🇴','🇵🇪','🇻🇪','🇨🇱'] },
];

type Props = {
  onSelect: (emoji: string) => void;
  isDark: boolean;
  onClose?: () => void;
};

export const EmojiPicker = ({ onSelect, isDark, onClose }: Props) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('recent');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentEmojis(parsed.slice(0, MAX_RECENT));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const addRecent = useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      const next = [emoji, ...prev.filter(e => e !== emoji)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((emoji: string) => {
    addRecent(emoji);
    onSelect(emoji);
  }, [addRecent, onSelect]);

  const tabs = [
    { id: 'recent', label: '🕐' },
    ...CATEGORIES.map(c => ({ id: c.id, label: c.label })),
  ];

  const currentEmojis = activeTab === 'recent'
    ? recentEmojis
    : CATEGORIES.find(c => c.id === activeTab)?.emojis ?? [];

  return (
    <div className={`w-[320px] max-h-[360px] rounded-2xl flex flex-col overflow-hidden ${isDark ? 'bg-[#1a1d24] border border-white/10' : 'bg-white border border-black/10 shadow-lg'}`}>
      {onClose && (
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/10 text-slate-500'}`}
        >
          <X size={14} />
        </button>
      )}

      <div className="flex gap-1 overflow-x-auto scrollbar-none px-3 pt-3 pb-1.5 shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-colors ${
              activeTab === tab.id
                ? isDark ? 'bg-white/15' : 'bg-black/10'
                : isDark ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-black/5 text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
          >
            {currentEmojis.length === 0 ? (
              <div className={`text-xs text-center py-8 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                 {t('emoji.noRecent')}
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-1">
                {currentEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleSelect(emoji)}
                    className={`w-9 h-9 flex items-center justify-center cursor-pointer rounded-lg text-xl transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
