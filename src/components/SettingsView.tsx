import { SettingsSectionContent } from './settings/SettingsSectionContent';

export const SettingsView = ({ theme, setTheme, setSubView, fontSize: fontSizeProp, setFontSize: setFontSizeProp, language: languageProp, setLanguage: setLanguageProp }: { theme: 'light' | 'dark', setTheme?: (t: 'light' | 'dark') => void, setSubView?: (view: string | null) => void; fontSize?: string; setFontSize?: (s: string) => void; language?: string; setLanguage?: (l: string) => void }) => {
  // NOTE: The settings panel must NOT create its own scroll region. It is rendered
  // inside the app's main-content container (AppShell), which already scrolls.
  // Do NOT add overflow-y-auto / h-full / min-h-0 here — let the content flow and
  // the surrounding layout scroll naturally (so the user just scrolls the page down).
  return (
    <div className={`glass-panel w-full max-w-none md:max-w-[640px] flex-1 flex flex-col p-4 sm:p-6 mb-8 pb-[calc(56px+var(--spacing-16)+env(safe-area-inset-bottom,0px))] sm:pb-8 rounded-2xl overflow-x-hidden`}>
      <SettingsSectionContent theme={theme} setTheme={setTheme} setSubView={setSubView} fontSize={fontSizeProp} setFontSize={setFontSizeProp} language={languageProp} setLanguage={setLanguageProp} />
    </div>
  );
};
