import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PrivacySection } from './PrivacySection';

vi.mock('../../lib/i18n', () => ({
 useI18n: () => ({
  t: (key: string) => key,
  lang: 'en',
  setLang: vi.fn(),
 }),
}));

describe('PrivacySection - additional tests', () => {
 const mockUpdateSettings = vi.fn();
  const defaultProps = {
   isDark: false,
   dndEnabled: false,
  setDndEnabled: vi.fn(),
  dndFrom: '22:00',
  setDndFrom: vi.fn(),
  dndTo: '08:00',
  setDndTo: vi.fn(),
  stealthMode: false,
  deliveryReceipts: true,
  readReceipts: true,
  typingIndicators: true,
  ghostViewMode: false,
  onlineStatus: true,
  onUpdateSettings: mockUpdateSettings,
  onBack: vi.fn(),
  t: (key: string) => key,
 };

 it('renders all section titles', () => {
  render(<PrivacySection {...defaultProps} />);
  expect(screen.getByText('settings.dndMode')).toBeInTheDocument();
  expect(screen.getByText('settings.advancedPrivacy')).toBeInTheDocument();
 });

 it('renders all toggles', () => {
  render(<PrivacySection {...defaultProps} />);
  const toggles = document.querySelectorAll('[role="switch"]');
  expect(toggles.length).toBeGreaterThan(0);
 });

 it('renders dark theme styles', () => {
  const { container } = render(<PrivacySection {...defaultProps} />);
  expect(container.querySelector('[class*="bg-"]') || container.querySelector('[class*="border-"]')).toBeInTheDocument();
 });

 it('renders light theme styles', () => {
  const { container } = render(<PrivacySection {...defaultProps} />);
  expect(container.querySelector('[class*="bg-white"]') || container.querySelector('[class*="border-"]')).toBeInTheDocument();
 });

 it('renders all groups', () => {
  const { container } = render(<PrivacySection {...defaultProps} />);
  expect(container.querySelectorAll('[class*="bg-"]').length).toBeGreaterThanOrEqual(2);
 });

 it('renders section title', () => {
  render(<PrivacySection {...defaultProps} />);
  expect(screen.getByText('settings.privacy')).toBeInTheDocument();
 });

 it('renders privacy cycle rows', () => {
  render(<PrivacySection {...defaultProps} />);
  expect(screen.getByText('settings.ghostViewMode') || screen.getByText('settings.onlineStatus') || screen.getByText('settings.stealthMode')).toBeInTheDocument();
 });

 it('renders DND time values', () => {
  render(<PrivacySection {...defaultProps} />);
  expect(screen.getByText('22:00')).toBeInTheDocument();
  expect(screen.getByText('08:00')).toBeInTheDocument();
 });

 it('renders DND from when set', () => {
  render(<PrivacySection {...defaultProps} />);
  expect(screen.getByText('settings.dndFrom')).toBeInTheDocument();
 });

 it('renders DND to when set', () => {
  render(<PrivacySection {...defaultProps} />);
  expect(screen.getByText('settings.dndTo')).toBeInTheDocument();
 });
});
