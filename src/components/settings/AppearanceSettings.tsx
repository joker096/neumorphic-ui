import { Palette, Sparkles } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';

interface AppearanceSettingsProps {
  isDark?: boolean;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  fontSize: string;
  setFontSize: (s: string) => void;
  uiAnimations: boolean;
  setUiAnimations: (v: boolean) => void;
  themeMode?: 'light' | 'dark' | 'system';
  setThemeMode?: (mode: 'light' | 'dark' | 'system') => void;
  accentColor?: string;
  setAccentColor?: (color: string) => void;
  chatBackground?: string;
  setChatBackground?: (bg: string) => void;
  density?: 'comfortable' | 'compact';
  setDensity?: (d: 'comfortable' | 'compact') => void;
  messageRadius?: number;
  setMessageRadius?: (r: number) => void;
  animationIntensity?: 'off' | 'low' | 'high';
  setAnimationIntensity?: (i: 'off' | 'low' | 'high') => void;
  onBack: () => void;
}

export const AppearanceSettings = ({
  isDark = false, theme, setTheme, fontSize, setFontSize, themeMode, setThemeMode, accentColor, setAccentColor, chatBackground, setChatBackground, density, setDensity, messageRadius, setMessageRadius, animationIntensity, setAnimationIntensity, onBack
}: AppearanceSettingsProps) => {
  const { t } = useI18n();

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

  const fontSizeLabel = (v: string) =>
    v === 'Small' ? t('settings.fontSizeSmall', 'Small')
      : v === 'Medium' ? t('settings.fontSizeMedium', 'Medium')
      : v === 'Large' ? t('settings.fontSizeLarge', 'Large')
      : v;

  return (
    <SubView title={t('settings.appearance')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.appearanceDescription')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
              <Palette size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.darkTheme')}</div>
              <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.themeModeSubtitle')}</div>
            </div>
          </div>
          <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden">
            {(['light','dark','system'] as const).map((m) => (
              <button key={m} type="button" data-testid={`theme-mode-${m}`} onClick={() => handleThemeMode(m)}
                className={`px-3 py-1.5 text-xs font-medium ${ (themeMode ?? 'system') === m ? 'bg-emerald-500 text-white' : (isDark ? 'text-gray-300' : 'text-slate-600') }`}>
                {t(`settings.themeMode.${m}`)}
              </button>
            ))}
          </div>
        </div>
        <SettingsRow
          icon={<span className="text-sm font-bold">Aa</span>}
          iconBg="t-accent-bg"
          iconColor="t-accent"
          title={t('settings.fontSize')}
          subtitle={t('settings.fontSizeSubtitle')}
          isDark={isDark}
          value={fontSizeLabel(fontSize)}
          onClick={() => setFontSize(fontSize === 'Small' ? 'Medium' : fontSize === 'Medium' ? 'Large' : 'Small')}
        />
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-purple-500/10" : "bg-purple-100"}`}>
              <Sparkles size={16} className={isDark ? "text-purple-400" : "text-purple-600"} />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.animations')}</div>
              <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.animationsSubtitle')}</div>
            </div>
          </div>
          <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden">
            {(['off','low','high'] as const).map((i) => (
              <button key={i} type="button" onClick={() => setAnimationIntensity?.(i)}
                className={`px-2.5 py-1.5 text-xs ${ (animationIntensity ?? 'high') === i ? 'bg-purple-500 text-white' : (isDark ? 'text-gray-300' : 'text-slate-600') }`}>
                {t(`settings.anim.${i}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
              <Palette size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.accentColor')}</div>
              <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.accentColorSubtitle')}</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            {['#10b981','#3b82f6','#8b5cf6','#ec4899','#f59e0b','#ef4444','#14b8a6','#6366f1'].map((c) => (
              <button key={c} type="button" aria-label={c} onClick={() => setAccentColor?.(c)}
                aria-pressed={(accentColor ?? '#10b981') === c}
                className={`group flex items-center justify-center min-w-11 min-h-11 w-6 h-6 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 ${ (accentColor ?? '#10b981') === c ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-tertiary)]' : '' }`}>
                <span className={`block w-6 h-6 rounded-full border-2 transition-transform group-hover:scale-110 ${ (accentColor ?? '#10b981') === c ? 'border-white' : 'border-transparent' }`}
                  style={{ background: c }} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-cyan-500/10" : "bg-cyan-100"}`}>
              <Palette size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.chatBackground')}</div>
              <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.chatBackgroundSubtitle')}</div>
            </div>
          </div>
          <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden">
            {(['default','light','dark','dots'] as const).map((bg) => (
              <button key={bg} type="button" onClick={() => setChatBackground?.(bg)}
                className={`px-2.5 py-1.5 text-xs ${ (chatBackground ?? 'default') === bg ? 'bg-cyan-500 text-white' : (isDark ? 'text-gray-300' : 'text-slate-600') }`}>
                {t(`settings.chatbg.${bg}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-amber-500/10" : "bg-amber-100"}`}>
              <Palette size={16} className={isDark ? "text-amber-400" : "text-amber-600"} />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.density')}</div>
              <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.densitySubtitle')}</div>
            </div>
          </div>
          <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden">
            {(['comfortable','compact'] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDensity?.(d)}
                className={`px-2.5 py-1.5 text-xs ${ (density ?? 'comfortable') === d ? 'bg-amber-500 text-white' : (isDark ? 'text-gray-300' : 'text-slate-600') }`}>
                {t(`settings.densityMode.${d}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-rose-500/10" : "bg-rose-100"}`}>
              <Palette size={16} className={isDark ? "text-rose-400" : "text-rose-600"} />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.messageRadius')}</div>
              <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.messageRadiusSubtitle')}</div>
            </div>
          </div>
          <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden">
            {[8,12,16,24].map((r) => (
              <button key={r} type="button" onClick={() => setMessageRadius?.(r)}
                className={`px-2.5 py-1.5 text-xs ${ (messageRadius ?? 16) === r ? 'bg-rose-500 text-white' : (isDark ? 'text-gray-300' : 'text-slate-600') }`}>
                {r}px
              </button>
            ))}
          </div>
        </div>
      </SettingsGroup>
    </SubView>
  );
};
