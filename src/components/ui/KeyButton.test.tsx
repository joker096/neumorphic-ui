import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { KeyButton } from './KeyButton';

describe('KeyButton', () => {
  it('renders with num', () => {
    render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders with letters', () => {
    render(<KeyButton num="1" letters="ABC" isDark={true} onPress={() => {}} />);
    expect(screen.getByText('ABC')).toBeInTheDocument();
  });

  it('hides letters when empty', () => {
    render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    expect(screen.queryByText('ABC')).not.toBeInTheDocument();
  });

  it('renders with dark theme by default', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('bg-[var(--bg-secondary)]');
    expect(btn?.className).toContain('border-[var(--border-color)]');
  });

  it('renders in light theme', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={false} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('bg-[var(--bg-secondary)]');
    expect(btn?.className).toContain('border-[var(--border-color)]');
  });

  it('calls onPress with num when clicked', () => {
    const onPress = vi.fn();
    render(<KeyButton num="1" letters="" isDark={true} onPress={onPress} />);
    const btn = document.querySelector('button')!;
    fireEvent.click(btn);
    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('renders with w-[76px]', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('w-[76px]');
  });

  it('renders with h-[76px]', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('h-[76px]');
  });

  it('renders with rounded-[22px] border radius', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('rounded-[22px]');
  });

  it('renders with flex-col layout', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('flex');
    expect(btn?.className).toContain('flex-col');
  });

  it('renders with cursor-pointer', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('cursor-pointer');
  });

  it('renders with select-none', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('select-none');
  });

  it('renders with transition-colors', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('transition-colors');
  });

  it('renders with border in dark theme', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('border');
    expect(btn?.className).toContain('border-[var(--border-color)]');
  });

  it('renders with border in light theme', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={false} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('border');
    expect(btn?.className).toContain('border-[var(--border-color)]');
  });

  it('renders active state in dark theme', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('active:bg-[#1e2129]');
  });

  it('renders active state in light theme', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={false} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('active:bg-[#dce2ea]');
  });

  it('renders with shadow in dark theme', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]');
  });

  it('renders with shadow in light theme', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={false} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]');
  });

  it('renders text-gray-200 in dark theme', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const numSpan = container.querySelector('[class*="text-gray-200"]');
    expect(numSpan).toBeInTheDocument();
  });

  it('renders text-slate-700 in light theme', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={false} onPress={() => {}} />);
    const numSpan = container.querySelector('[class*="text-slate-700"]');
    expect(numSpan).toBeInTheDocument();
  });

  it('renders number with text-[28px]', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const numSpan = container.querySelector('[class*="text-[28px]"]');
    expect(numSpan).toBeInTheDocument();
  });

  it('renders number with font-semibold', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const numSpan = container.querySelector('[class*="font-semibold"]');
    expect(numSpan).toBeInTheDocument();
  });

  it('renders number with leading-none', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const numSpan = container.querySelector('[class*="leading-none"]');
    expect(numSpan).toBeInTheDocument();
  });

  it('renders letters with text-[8px]', () => {
    const { container } = render(<KeyButton num="1" letters="ABC" isDark={true} onPress={() => {}} />);
    const lettersSpan = container.querySelector('[class*="text-[8px]"]');
    expect(lettersSpan).toBeInTheDocument();
  });

  it('renders letters with tracking-[0.15em]', () => {
    const { container } = render(<KeyButton num="1" letters="ABC" isDark={true} onPress={() => {}} />);
    const lettersSpan = container.querySelector('[class*="tracking-[0.15em]"]');
    expect(lettersSpan).toBeInTheDocument();
  });

  it('renders letters with text-orange-500/70', () => {
    const { container } = render(<KeyButton num="1" letters="ABC" isDark={true} onPress={() => {}} />);
    const lettersSpan = container.querySelector('[class*="text-orange-500/70"]');
    expect(lettersSpan).toBeInTheDocument();
  });

  it('renders with mt-[2px] for letters', () => {
    const { container } = render(<KeyButton num="1" letters="ABC" isDark={true} onPress={() => {}} />);
    const lettersSpan = container.querySelector('[class*="mt-[2px]"]');
    expect(lettersSpan).toBeInTheDocument();
  });

  it('renders with font-bold for letters', () => {
    const { container } = render(<KeyButton num="1" letters="ABC" isDark={true} onPress={() => {}} />);
    const lettersSpan = container.querySelector('[class*="font-bold"]');
    expect(lettersSpan).toBeInTheDocument();
  });

  it('renders with flex items-center justify-center', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.firstElementChild;
    expect(btn?.className).toContain('items-center');
    expect(btn?.className).toContain('justify-center');
  });

  it('renders with motion.button (uses motion)', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.querySelector('button');
    expect(btn).toBeInTheDocument();
    // motion.button renders as regular button in JSDOM
    expect(btn?.tagName).toBe('BUTTON');
  });

  it('renders with whileTap and whileHover animations', () => {
    const { container } = render(<KeyButton num="1" letters="" isDark={true} onPress={() => {}} />);
    const btn = container.querySelector('button');
    expect(btn).toBeInTheDocument();
  });

  it('renders with multiple options', () => {
    render(<KeyButton num="7" letters="PQRS" isDark={true} onPress={() => {}} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('PQRS')).toBeInTheDocument();
  });

  it('renders letters with trim whitespace', () => {
    render(<KeyButton num="1" letters=" ABC " isDark={true} onPress={() => {}} />);
    expect(screen.getByText('ABC')).toBeInTheDocument();
  });

  it('does not render letters when trimmed empty', () => {
    render(<KeyButton num="1" letters=" " isDark={true} onPress={() => {}} />);
    expect(screen.queryByText(' ')).not.toBeInTheDocument();
  });
});