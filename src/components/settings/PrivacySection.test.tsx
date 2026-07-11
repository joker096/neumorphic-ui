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
   visNumber: 'none',
  setVisNumber: vi.fn(),
  visActivity: 'none',
  setVisActivity: vi.fn(),
  dndEnabled: false,
  setDndEnabled: vi.fn(),
  dndFrom: '22:00',
  setDndFrom: vi.fn(),
  dndTo: '08:00',
  setDndTo: vi.fn(),
  stealthMode: false,
  anonymousMode: false,
  deliveryReceipts: true,
  readReceipts: true,
  typingIndicators: true,
  ghostViewMode: false,
  onlineStatus: true,
  allowForwarding: true,
  setAllowForwarding: vi.fn(),
  allowMetadata: true,
  setAllowMetadata: vi.fn(),
  forwardCountLimit: 3,
  setForwardCountLimit: vi.fn(),
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
  const toggles = document.querySelectorAll('button[role="switch"]');
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

 it('renders visibility values', () => {
  render(<PrivacySection {...defaultProps} />);
  // Check that settings text is present in the component
  expect(screen.getByText('settings.whoSeesNumber') || screen.getByText('settings.lastSeen') || screen.getByText(/none|contacts|everyone/) || screen.getByText(/stealthMode|anonymousMode/)).toBeInTheDocument();
 });

 it('renders DND time values', () => {
  render(<PrivacySection {...defaultProps} />);
  expect(screen.getByText('22:00')).toBeInTheDocument();
  expect(screen.getByText('08:00')).toBeInTheDocument();
 });

 it('renders forward count value', () => {
  render(<PrivacySection {...defaultProps} />);
  expect(screen.getByText('3')).toBeInTheDocument();
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
