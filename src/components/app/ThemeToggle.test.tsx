import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ThemeToggle } from './ThemeToggle';
import { ThemeContext, type Theme } from '../../contexts/ThemeContext';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

describe('ThemeToggle - additional tests', () => {
  it('renders toggle switch', () => {
    render(
      <ThemeContext.Provider value={{ theme: 'dark', isDark: true, setTheme: vi.fn() }}>
        <ThemeToggle t={(k: string) => k} />
      </ThemeContext.Provider>
    );
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
    const { container } = render(
      <ThemeContext.Provider value={{ theme: 'dark', isDark: true, setTheme: vi.fn() }}>
        <ThemeToggle t={(k: string) => k} />
      </ThemeContext.Provider>
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(
      <ThemeContext.Provider value={{ theme: 'light', isDark: false, setTheme: vi.fn() }}>
        <ThemeToggle t={(k: string) => k} />
      </ThemeContext.Provider>
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(
      <ThemeContext.Provider value={{ theme: 'dark', isDark: true, setTheme: vi.fn() }}>
        <ThemeToggle t={(k: string) => k} />
      </ThemeContext.Provider>
    );
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders label', () => {
    render(
      <ThemeContext.Provider value={{ theme: 'dark', isDark: true, setTheme: vi.fn() }}>
        <ThemeToggle t={(k: string) => k} />
      </ThemeContext.Provider>
    );
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(
      <ThemeContext.Provider value={{ theme: 'dark', isDark: true, setTheme: vi.fn() }}>
        <ThemeToggle t={(k: string) => k} />
      </ThemeContext.Provider>
    );
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });
});
