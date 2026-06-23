import React from 'react';
import { Globe } from 'lucide-react';
import { SettingsRow, SettingsGroup } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { Check } from 'lucide-react';

type Translate = (key: string, options?: any) => string;

interface LanguageSectionProps {
  isDark: boolean;
  language: string;
  setLanguage: (lang: string) => void;
  setLang: (lang: string) => void;
  onBack: () => void;
  t: Translate;
}

const LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
];

export const LanguageSection = ({ isDark, language, setLanguage, setLang, onBack, t }: LanguageSectionProps) => (
  <SubView title={t('settings.language')} isDark={isDark} onBack={onBack}>
    <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
      {LANGUAGES.map(lang => (
        <SettingsRow 
          key={lang.code}
          title={lang.name}
          isDark={isDark}
          rightElement={language === lang.code ? <Check size={16} className="text-emerald-500" /> : <div className="w-4 h-4" />}
          onClick={() => { setLanguage(lang.code); setLang(lang.code); }}
        />
      ))}
    </div>
  </SubView>
);