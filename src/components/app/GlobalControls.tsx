import { LanguageSelector, ThemeToggle } from "../AppChrome";

type Translate = (key: string, options?: any) => string;

type GlobalControlsProps = {
  isDark: boolean;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  showLangMenu: boolean;
  setShowLangMenu: (show: boolean) => void;
  language: string;
  setLanguage: (code: string) => void;
  t: Translate;
};

export const GlobalControls = ({
  isDark,
  theme,
  setTheme,
  showLangMenu,
  setShowLangMenu,
  language,
  setLanguage,
  t,
}: GlobalControlsProps) => (
  <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[300] flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
    <ThemeToggle isDark={isDark} theme={theme} setTheme={setTheme} t={t} />
    <LanguageSelector
      isDark={isDark}
      showLangMenu={showLangMenu}
      setShowLangMenu={setShowLangMenu}
      language={language}
      setLanguage={setLanguage}
      t={t}
    />
  </div>
);
