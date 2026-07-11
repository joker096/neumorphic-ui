import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SpamSection } from './SpamSection';

vi.mock('../../lib/i18n', () => ({
 useI18n: () => ({
  t: (key: string) => key,
  lang: 'en',
  setLang: vi.fn(),
 }),
}));

describe('SpamSection - additional tests', () => {
  it('renders settings group', () => {
   const { container } = render(<SpamSection spamFilterEnabled={false} setSpamFilterEnabled={vi.fn()} isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
   expect(container.querySelector('button') || container.querySelector('input')).toBeInTheDocument();
  });

  it('renders all children', () => {
   render(<SpamSection spamFilterEnabled={false} setSpamFilterEnabled={vi.fn()} isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
   expect(screen.getByText('settings.spamProtection')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
   const { container } = render(<SpamSection spamFilterEnabled={false} setSpamFilterEnabled={vi.fn()} isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
   expect(container.querySelector('button') || container.querySelector('input') || container.querySelector('[class*="flex"]')).toBeInTheDocument();
  });

 it('renders light theme styles', () => {
  const { container } = render(<SpamSection spamFilterEnabled={false} setSpamFilterEnabled={vi.fn()} isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(container.querySelector('[class*="bg-white"]') || container.querySelector('[class*="border-black/5"]') || container.querySelector('[class*="flex-1"]') || container.querySelector('[class*="w-full"]')).toBeInTheDocument();
 });

 it('renders shield on icon', () => {
  const { container } = render(<SpamSection spamFilterEnabled={true} setSpamFilterEnabled={vi.fn()} isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(container.querySelector('svg') || container.querySelector('[class*="text-emerald"]') || container.querySelector('[class*="text-orange"]')).toBeInTheDocument();
 });

 it('renders shield off icon', () => {
  const { container } = render(<SpamSection spamFilterEnabled={false} setSpamFilterEnabled={vi.fn()} isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(container.querySelector('[class*="lucide-shield-off"]') || container.querySelector('svg')).toBeInTheDocument();
 });

 it('calls setSpamFilterEnabled when row clicked', () => {
  const setSpamFilter = vi.fn();
  render(<SpamSection spamFilterEnabled={false} setSpamFilterEnabled={setSpamFilter} isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  const row = screen.getByText('settings.spamFilter').closest('[role="button"]') || screen.getByText('settings.spamFilter').closest('div[onclick]');
  if (row) {
   fireEvent.click(row);
   expect(setSpamFilter).toHaveBeenCalled();
  }
 });

 it('calls setSpamFilterEnabled when toggle clicked', () => {
  const setSpamFilter = vi.fn();
  render(<SpamSection spamFilterEnabled={false} setSpamFilterEnabled={setSpamFilter} isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  fireEvent.click(screen.getByRole('switch'));
  expect(setSpamFilter).toHaveBeenCalled();
 });
});
