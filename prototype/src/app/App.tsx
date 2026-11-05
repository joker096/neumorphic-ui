import { Moon, Sun } from 'lucide-react';
import { PhoneFrame } from './PhoneFrame';
import { Router } from './router';
import { useThemeStore } from '../store/theme';
import appStyles from './App.module.css';

export function App() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <PhoneFrame>
      <Router />
      {/* Temporary dev panel: lets reviewers flip both themes on any screen. */}
      <button
        type="button"
        className={appStyles.themeToggle}
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      </button>
    </PhoneFrame>
  );
}
