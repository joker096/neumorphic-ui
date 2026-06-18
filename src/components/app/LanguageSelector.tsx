import { AnimatePresence, motion } from "motion/react";
import { Check, Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
];

type Translate = (key: string, options?: any) => string;

type LanguageSelectorProps = {
  isDark: boolean;
  showLangMenu: boolean;
  setShowLangMenu: (show: boolean) => void;
  language: string;
  setLanguage: (code: string) => void;
  t: Translate;
};

export const LanguageSelector = ({
  isDark,
  showLangMenu,
  setShowLangMenu,
  language,
  setLanguage,
  t,
}: LanguageSelectorProps) => (
  <div className="relative group">
    <button
      onClick={() => setShowLangMenu(!showLangMenu)}
      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
        isDark
          ? "bg-[#11141c]/80 border border-white/10 hover:bg-white/10"
          : "bg-[#e2e8f0]/80 border border-black/5 hover:bg-white shadow-md"
      }`}
      title={t("common.selectLanguage")}
      aria-label={t("common.selectLanguage")}
    >
      <Globe size={16} className={isDark ? "text-gray-400" : "text-slate-500"} />
    </button>
    <AnimatePresence>
      {showLangMenu && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full right-0 mt-2 w-40 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-50"
        >
          <div className={isDark ? "bg-[#1a1d24] border border-white/10" : "bg-white border border-black/5"}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                  language === lang.code ? (isDark ? "bg-orange-500/20" : "bg-orange-500/10") : ""
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}>{lang.name}</span>
                {language === lang.code && <Check size={16} className="ml-auto text-orange-500" />}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
