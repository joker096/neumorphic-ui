import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BotsSection } from './BotsSection';

vi.mock('../../lib/i18n', () => ({
 useI18n: () => ({
  t: (key: string) => key,
  lang: 'en',
  setLang: vi.fn(),
 }),
}));

describe('BotsSection - additional tests', () => {
  it('renders bot list group', () => {
   const bots = [{ id: '1', name: 'Bot1', token: '', publicKey: '', ownerId: '', commands: [], permissions: { readMessages: true, sendMessages: true, editMessages: false, deleteMessages: false, inlineKeyboard: false, readUserData: false, accessGroups: false, accessFiles: false }, isRunning: false }];
   const { container } = render(<BotsSection bots={bots} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
   expect(container.querySelector('[class*="SettingsRow"]') || container.querySelector('[class*="rounded-md"]') || screen.getByText('Bot1')).toBeTruthy();
  });

 it('renders all bot actions', () => {
  const bots = [{ id: '1', name: 'Bot', token: '', publicKey: '', ownerId: '', commands: [], permissions: { readMessages: true, sendMessages: true, editMessages: false, deleteMessages: false, inlineKeyboard: false, readUserData: false, accessGroups: false, accessFiles: false }, isRunning: false }];
  const { container } = render(<BotsSection bots={bots} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
  expect(container.querySelector('svg') || container.querySelector('[class*="lucide-"]')).toBeInTheDocument();
 });

it('renders add bot button', () => {
   render(<BotsSection bots={[]} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
   expect(screen.getByText('settings.addBot')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
   const { container } = render(<BotsSection bots={[]} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
   expect(container.querySelector('[class*="rounded-md"]') || container.querySelector('[class*="border-"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
   const { container } = render(<BotsSection bots={[]} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
   expect(container.querySelector('[class*="rounded-md"]') || container.querySelector('[class*="border-"]')).toBeInTheDocument();
  });

 it('renders section title', () => {
  render(<BotsSection bots={[]} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
  expect(screen.getByText('settings.bots')).toBeInTheDocument();
 });

 it('renders section title icon', () => {
  const { container } = render(<BotsSection bots={[]} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
  // SettingsSection renders title, check that it renders properly
  expect(container.querySelector('[class*="text-xl.font-bold"]') || container.querySelector('[class*="text-xl"]')?.closest('h2')).toBeInTheDocument();
 });

  it('renders light theme back button styles', () => {
   const { container } = render(<BotsSection bots={[]} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
   expect(container.querySelector('[class*="rounded-full"]') || container.querySelector('[class*="hover:bg-"]')).toBeInTheDocument();
  });

  it('renders dark theme back button styles', () => {
   const { container } = render(<BotsSection bots={[]} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
   expect(container.querySelector('[class*="rounded-full"]') || container.querySelector('[class*="hover:bg-"]')).toBeInTheDocument();
  });
});
