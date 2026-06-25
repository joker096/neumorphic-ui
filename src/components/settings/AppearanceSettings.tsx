import { motion } from 'motion/react';
import { Download, Palette } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { ThemeToggle } from '../app/ThemeToggle';

interface AppearanceSettingsProps {
  isDark: boolean;
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
  isDark, theme, setTheme, fontSize, setFontSize, uiAnimations, setUiAnimations, showPwaBanner, setShowPwaBanner, onBack
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
              <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.darkTheme')}</div>
              <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.darkThemeSubtitle')}</div>
            </div>
          </div>
          <ThemeToggle isDark={isDark} theme={theme} setTheme={setTheme} t={t} />
        </div>
        <SettingsRow
          icon={<span className="text-sm font-bold">Aa</span>}
          iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
          iconColor={isDark ? "text-blue-400" : "text-blue-600"}
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
        />
      </SettingsGroup>
    </SubView>
  );
};