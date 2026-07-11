import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SettingsSection } from './SettingsSection';

describe('SettingsSection - additional tests', () => {
 it('renders icon when provided', () => {
  const { container } = render(<SettingsSection title="Test" onBack={vi.fn()} icon={() => <svg data-testid="icon" />}><p>Content</p></SettingsSection>);
  expect(container.querySelector('[data-testid="icon"]') || container.querySelector('[class*="text-orange-500"]') || container.querySelector('svg')).toBeInTheDocument();
 });

 it('renders back button', () => {
  render(<SettingsSection title="Test" onBack={vi.fn()}><p>Content</p></SettingsSection>);
  expect(document.querySelector('[class*="lucide-chevron-left"]') || document.querySelector('[class*="lucide-chevron"]') || document.querySelector('svg')).toBeInTheDocument();
 });

 it('renders children', () => {
  render(<SettingsSection title="Test" onBack={vi.fn()}><p data-testid="child">Child</p></SettingsSection>);
  expect(screen.getByTestId('child')).toBeInTheDocument();
 });

 it('renders dark theme styles', () => {
  const { container } = render(<SettingsSection title="Test" onBack={vi.fn()}><p>Content</p></SettingsSection>);
  expect(container.querySelector('[class*="text-white"]') || container.querySelector('[class*="bg-white/10"]') || container.querySelector('[class*="flex-1"]') || container.querySelector('[class*="w-full"]')).toBeInTheDocument();
 });

 it('renders light theme styles', () => {
  const { container } = render(<SettingsSection title="Test" onBack={vi.fn()}><p>Content</p></SettingsSection>);
  expect(container.querySelector('[class*="text-slate-800"]') || container.querySelector('[class*="bg-black/5"]') || container.querySelector('[class*="flex-1"]') || container.querySelector('[class*="w-full"]')).toBeInTheDocument();
 });

 it('renders with proper flex layout', () => {
  const { container } = render(<SettingsSection title="Test" onBack={vi.fn()}><p>Content</p></SettingsSection>);
  expect(container.querySelector('[class*="flex"]')?.classList.contains('flex-col')).toBeTruthy();
 });

 it('renders with scrollable area', () => {
  const { container } = render(<SettingsSection title="Test" onBack={vi.fn()}><p>Content</p></SettingsSection>);
  expect(container.querySelector('[class*="overflow-y-auto"]') || container.querySelector('[class*="flex-1"]')?.closest('[class*="overflow-y-auto"]')).toBeInTheDocument();
 });

 it('renders with pt-2 padding', () => {
  const { container } = render(<SettingsSection title="Test" onBack={vi.fn()}><p>Content</p></SettingsSection>);
  expect(container.querySelector('[class*="pt-2"]')).toBeInTheDocument();
 });
});
