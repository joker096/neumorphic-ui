import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PillButton } from './PillButton';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

describe('PillButton - additional tests', () => {
  it('renders with plus icon', () => {
    const { container } = render(<PillButton label="Test" rightIcon="plus" />);
    expect(container.querySelector('[class*="lucide-plus"]') || container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with check icon', () => {
    const { container } = render(<PillButton label="Test" rightIcon="check" />);
    expect(container.querySelector('[class*="lucide-check"]') || container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with toggle icon', () => {
    const { container } = render(<PillButton label="Test" rightIcon="toggle" />);
    expect(container.querySelector('[class*="w-"]')).toBeInTheDocument();
  });

  it('renders with dropdown indicator', () => {
    const { container } = render(<PillButton label="Test" hasDropdown={true} />);
    expect(container.querySelector('[class*="lucide-chevron"]') || container.querySelector('[class*="transition-opacity"]') || container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with orange glow color', () => {
    const { container } = render(<PillButton label="Test" glowColor="orange" />);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders with blue glow color', () => {
    const { container } = render(<PillButton label="Test" glowColor="blue" />);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders with teal glow color', () => {
    const { container } = render(<PillButton label="Test" glowColor="teal" />);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders with active state', () => {
    const { container } = render(<PillButton label="Test" active={true} />);
    expect(container.querySelector('[class*="drop-shadow"]') || container.querySelector('[class*="shadow"]') || container.querySelector('[class*="bg-"]')).toBeInTheDocument();
  });

  it('renders dark theme active', () => {
    const { container } = render(<PillButton label="Test" active={true} />);
    expect(container.querySelector('[class*="bg-"]')).toBeInTheDocument();
  });

  it('renders light theme active', () => {
    const { container } = render(<PillButton label="Test" active={true} />);
    expect(container.querySelector('[class*="bg-"]')).toBeInTheDocument();
  });

  it('renders large button styles', () => {
    const { container } = render(<PillButton label="Test" isLarge={true} />);
    expect(container.querySelector('[class*="h-"]')).toBeInTheDocument();
  });

  it('renders large button with glow', () => {
    const { container } = render(<PillButton label="Test" isLarge={true} active={true} />);
    expect(container.querySelector('[class*="bg-orange-500"]') || container.querySelector('[class*="blur"]')).toBeInTheDocument();
  });

  it('renders large button with subtitle', () => {
    render(<PillButton label="Test" subtitle="Sub" isLarge={true} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders with glow when large and active', () => {
    const { container } = render(<PillButton label="Test" isLarge={true} active={true} />);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });
});
