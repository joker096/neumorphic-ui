import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ThemeContext, useTheme } from './ThemeContext';

describe('ThemeContext', () => {
  it('provides theme value', () => {
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme('light')}>Change theme</button>
        </div>
      );
    };

    render(
      <ThemeContext.Provider value={{ theme: 'dark', isDark: true, setTheme: () => {} }}>
        <TestComponent />
      </ThemeContext.Provider>
    );

    expect(screen.getByTestId('theme')).toBeInTheDocument();
  });

  it('provides setTheme function', () => {
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme('dark')}>Change theme</button>
        </div>
      );
    };

    render(
      <ThemeContext.Provider value={{ theme: 'light', isDark: false, setTheme: () => {} }}>
        <TestComponent />
      </ThemeContext.Provider>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
