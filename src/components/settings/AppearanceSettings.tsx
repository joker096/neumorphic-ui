import { motion } from 'motion/react';
import { Apple, Download, Palette, Sparkles, Monitor, Smartphone } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { APP_INFO, APK_URL } from '../../config/settingsDefaults';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { ThemeToggle } from '../app/ThemeToggle';

interface AppearanceSettingsProps {
  isDark?: boolean;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  fontSize: string;
  setFontSize: (s: string) => void;
  uiAnimations: boolean;
  setUiAnimations: (v: boolean) => void;
  showPwaBanner: boolean;
  setShowPwaBanner: (v: boolean) => void;
  onBack: () => void;
}

export const AppearanceSettings = ({
  isDark = false, theme, setTheme, fontSize, setFontSize, uiAnimations, setUiAnimations, showPwaBanner, setShowPwaBanner, onBack
}: AppearanceSettingsProps) => {
  const { t } = useI18n();

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
              <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.darkThemeSubtitle')}</div>
            </div>
          </div>
          <ThemeToggle isDark={isDark} theme={theme} setTheme={setTheme} t={t} />
        </div>
        <SettingsRow
          icon={<span className="text-sm font-bold">Aa</span>}
          iconBg="t-accent-bg"
          iconColor="t-accent"
          title={t('settings.fontSize')}
          subtitle={t('settings.fontSizeSubtitle')}
          isDark={isDark}
          value={fontSize}
          onClick={() => setFontSize(fontSize === 'Small' ? 'Medium' : fontSize === 'Medium' ? 'Large' : 'Small')}
        />
        <SettingsToggleRow
          icon={<span className="text-sm font-bold">✦</span>}
          iconBg={isDark ? "bg-purple-500/10" : "bg-purple-100"}
          iconColor={isDark ? "text-purple-400" : "text-purple-600"}
          title={t('settings.animations')}
          subtitle={t('settings.animationsSubtitle')}
          isOn={uiAnimations}
          isDark={isDark}
          onToggle={() => setUiAnimations(!uiAnimations)}
          toggleOnIcon={<Sparkles size={14} />}
          toggleOffIcon={<Sparkles size={14} />}
        />
        <SettingsToggleRow
          icon={<Download size={16} />}
          iconBg={isDark ? "bg-cyan-500/10" : "bg-cyan-100"}
          iconColor={isDark ? "text-cyan-400" : "text-cyan-600"}
          title={t('settings.pwaPrompt')}
          subtitle={t('settings.pwaPromptSubtitle')}
          isOn={showPwaBanner}
          isDark={isDark}
          onToggle={() => setShowPwaBanner(!showPwaBanner)}
          toggleOnIcon={<Download size={14} />}
          toggleOffIcon={<Download size={14} />}
        />
      </SettingsGroup>

      {showPwaBanner && (
        <div className={`mt-4 rounded-xl border ${isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
              <Monitor size={20} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
            </div>
            <div className="flex-1">
              <div className={`text-sm font-semibold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{t('settings.installApp', { app: APP_INFO.NAME })}</div>
              <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.pwaWorksOffline', 'Works offline')} • {t('settings.pwaFasterLoading', 'Faster loading')} • {t('settings.pwaAddToHomeScreen', 'Add to home screen')}</div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <a
              href={APK_URL}
              download
              className={`flex items-center gap-3 rounded-lg px-0 py-3 ${isDark ? "active:bg-white/5" : "active:bg-black/5"}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
                <Smartphone size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.platformAndroid')}</div>
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                <Download size={14} />
                {t('settings.downloadApk')}
              </span>
            </a>
            <div className={`my-1 border-t ${isDark ? "border-emerald-500/10" : "border-emerald-200"}`} />
            <div className="flex items-center gap-3 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-gray-500/10" : "bg-gray-100"}`}>
                <Apple size={16} className={isDark ? "text-gray-400" : "text-gray-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.platformIos')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.installIosSteps')}</div>
              </div>
            </div>
            <div className={`my-1 border-t ${isDark ? "border-emerald-500/10" : "border-emerald-200"}`} />
            <div className="flex items-center gap-3 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-cyan-500/10" : "bg-cyan-100"}`}>
                <Monitor size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.platformDesktop')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.installDesktopSteps')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SubView>
  );
};
