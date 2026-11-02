import { useState } from "react";
import { Check, ChevronDown, Globe, Moon, Palette } from "lucide-react";
import { SettingsCard } from "./SettingsMenuPrimitives";
import { SettingsToggleRow } from "../ui/SettingsRow";
import { ROW_SHELL_CLASS, SEGMENTED_TRACK_CLASS } from '../ui/rowClasses';
import { MUTED_CAPTION_CLASS, PRIMARY_LABEL_CLASS } from '../ui/textClasses';
import { LANGUAGES } from "./languages";

type T = (key: string, options?: any) => string;

interface QuickControlsCardProps {
  t: T;
  themeMode?: 'light' | 'dark' | 'system';
  setThemeMode?: (mode: 'light' | 'dark' | 'system') => void;
  setTheme?: (t: 'light' | 'dark') => void;
  onSelectLanguage?: (code: string) => void;
  language: string;
  dndEnabled?: boolean;
  setDndEnabled?: (v: boolean) => void;
  visible: {
    theme: boolean;
    lang: boolean;
    dnd: boolean;
  };
}

export function QuickControlsCard({
  t, themeMode, setThemeMode, setTheme, onSelectLanguage, language,
  dndEnabled, setDndEnabled, visible,
}: QuickControlsCardProps) {
  const [langOpen, setLangOpen] = useState(false);

  const handleThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode?.(mode);
    if (mode === 'system') {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
      setTheme?.(prefersDark ? 'dark' : 'light');
    } else {
      setTheme?.(mode);
    }
  };

  const currentLangName = LANGUAGES.find((l) => l.code === language)?.name ?? language;

  return (
    <SettingsCard>
      {visible.theme && (
        <div className={ROW_SHELL_CLASS}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/10">
              <Palette size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className={PRIMARY_LABEL_CLASS}>{t('settings.darkTheme')}</div>
              <div className={MUTED_CAPTION_CLASS}>{t('settings.themeModeSubtitle')}</div>
            </div>
          </div>
          <div className={SEGMENTED_TRACK_CLASS}>
            {(['light', 'dark', 'system'] as const).map((m) => (
              <button key={m} type="button" data-testid={`theme-mode-${m}`} onClick={() => handleThemeMode(m)}
                className={`min-h-11 flex items-center justify-center px-3 text-xs font-medium transition-colors ${(themeMode ?? 'system') === m ? 'bg-[var(--accent)] text-[var(--ink-on-saturate)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel-hover)]'}`}>
                {t(`settings.themeMode.${m}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {visible.lang && (
        <>
          <div className={ROW_SHELL_CLASS}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--accent-soft)]">
                <Globe size={16} className="t-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={PRIMARY_LABEL_CLASS}>{t('settings.language')}</div>
                <div className={MUTED_CAPTION_CLASS}>{currentLangName}</div>
              </div>
            </div>
            <button type="button" data-testid="language-select-toggle" aria-expanded={langOpen} aria-label={t('settings.language')}
              onClick={() => setLangOpen((o) => !o)}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel-hover)]">
              <ChevronDown size={18} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {langOpen && (
            <div className="border-t border-[var(--border-color)] px-2 py-2 max-h-64 overflow-y-auto">
              {LANGUAGES.map((l) => (
                <button key={l.code} type="button"
                  onClick={() => { onSelectLanguage?.(l.code); setLangOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 min-h-11 rounded-lg text-left text-sm text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel-hover)]">
                  <span>{l.name}</span>
                  {language === l.code && <Check size={16} className="text-emerald-500" />}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {visible.dnd && (
        <SettingsToggleRow
          icon={<Moon size={16} className="text-indigo-600 dark:text-indigo-400" />}
          iconBg="bg-indigo-100 dark:bg-indigo-500/10"
          title={t('settings.dnd')}
          subtitle={t('settings.dndSubtitle')}
          isOn={Boolean(dndEnabled)}
          onToggle={() => setDndEnabled?.(!dndEnabled)}
        />
      )}
    </SettingsCard>
  );
}
