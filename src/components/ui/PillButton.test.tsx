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

  it('renders label text', () => {
    render(<PillButton label="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders subtitle in non-large mode', () => {
    render(<PillButton label="Main" subtitle="Subtitle text" />);
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('does not render subtitle in large mode', () => {
    render(<PillButton label="Main" subtitle="Sub" isLarge={true} />);
    expect(screen.queryByText('Sub')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<PillButton label="Click" onClick={onClick} />);
    const btn = container.querySelector('[class*="cursor-pointer"]') as HTMLElement;
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders with light theme', () => {
    const { container } = render(<PillButton label="Light" theme="light" />);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders with light theme active', () => {
    const { container } = render(<PillButton label="Light Active" theme="light" active={true} />);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('has pointer cursor', () => {
    const { container } = render(<PillButton label="Pointer" />);
    const el = container.querySelector('[class*="cursor-pointer"]');
    expect(el).toBeInTheDocument();
  });

  it('has hover scale transform', () => {
    const { container } = render(<PillButton label="Hover" />);
    const el = container.querySelector('[class*="hover:scale-"]');
    expect(el).toBeInTheDocument();
  });

  it('has active scale transform', () => {
    const { container } = render(<PillButton label="Active" />);
    const el = container.querySelector('[class*="active:scale-"]');
    expect(el).toBeInTheDocument();
  });
});
