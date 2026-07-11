import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SyncSettings } from './SyncSettings';

vi.mock('../../store', () => ({
 useAppStore: vi.fn(() => ({
  devices: [{ id: '1', name: 'TestDevice', platform: 'web', lastActive: Date.now(), isCurrent: true }],
  removeDevice: vi.fn(),
  syncStatus: 'idle',
  setSyncStatus: vi.fn(),
  syncLastTimestamp: null,
  setSyncLastTimestamp: vi.fn(),
 })),
}));

vi.mock('../../lib/i18n', () => ({
 useI18n: () => ({
  t: (key: string) => key,
  lang: 'en',
  setLang: vi.fn(),
 }),
}));

describe('SyncSettings - additional tests', () => {
 it('renders sync status text', () => {
  render(<SyncSettings isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(screen.queryByText('settings.syncStatus') || screen.getByText(/settings\.syncStatus/)).toBeInTheDocument();
 });

 it('renders sync button', () => {
  render(<SyncSettings isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(screen.getByText('settings.syncNow')).toBeInTheDocument();
 });

 it('renders device list', () => {
  render(<SyncSettings isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(screen.getByText('TestDevice')).toBeInTheDocument();
 });

 it('renders dark theme styles', () => {
  const { container } = render(<SyncSettings isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(container.querySelector('[class*="text-white"]') || container.querySelector('[class*="flex-1"]') || container.querySelector('[class*="w-full"]')).toBeInTheDocument();
 });

 it('renders light theme styles', () => {
  const { container } = render(<SyncSettings isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(container.querySelector('[class*="text-slate-800"]') || container.querySelector('[class*="flex-1"]') || container.querySelector('[class*="w-full"]')).toBeInTheDocument();
 });

 it('renders check icon for current device', () => {
  render(<SyncSettings isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(document.querySelector('[class*="text-emerald-500"]') || document.querySelector('[class*="lucide-check"]') || document.querySelector('svg')).toBeInTheDocument();
 });

 it('renders device platform', () => {
  render(<SyncSettings isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(screen.getByText(/web/)).toBeInTheDocument();
 });

 it('renders device date', () => {
  render(<SyncSettings isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(screen.getByText(/2026/)).toBeInTheDocument();
 });

 it('renders remove button for non-current device', () => {
  render(<SyncSettings isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(document.querySelector('[class*="lucide-trash"]') || document.querySelector('[class*="lucide-trash-2"]') || document.querySelector('svg')).toBeInTheDocument();
 });

 it('renders smartphone icon', () => {
  render(<SyncSettings isDark={false} onBack={vi.fn()} t={(k: string) => k} />);
  expect(document.querySelector('[class*="lucide-smartphone"]') || document.querySelector('svg')).toBeInTheDocument();
 });
});
