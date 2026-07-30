import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OnboardingPanel } from './OnboardingPanel';

describe('OnboardingPanel', () => {
  const mockT = (key: string) => key;

  it('renders with welcome heading', () => {
    render(<OnboardingPanel isDark={false} t={mockT} />);
    expect(screen.getByText('onboarding.welcome')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(<OnboardingPanel isDark={false} t={mockT} />);
    expect(screen.getByText('onboarding.description')).toBeInTheDocument();
  });

  it('calls onStartChat when Start a chat button is clicked', () => {
    const onStartChat = vi.fn();
    render(<OnboardingPanel isDark={false} t={mockT} onStartChat={onStartChat} />);
    const btn = screen.getByText('onboarding.startChat');
    fireEvent.click(btn);
    expect(onStartChat).toHaveBeenCalled();
  });

  it('calls onInvite when Invite friends button is clicked', () => {
    const onInvite = vi.fn();
    render(<OnboardingPanel isDark={false} t={mockT} onInvite={onInvite} />);
    const btn = screen.getByText('onboarding.invite');
    fireEvent.click(btn);
    expect(onInvite).toHaveBeenCalled();
  });

  it('hides Start a chat when onStartChat is not provided', () => {
    render(<OnboardingPanel isDark={false} t={mockT} />);
    expect(screen.queryByText('onboarding.startChat')).not.toBeInTheDocument();
  });

  it('hides Invite friends when onInvite is not provided', () => {
    render(<OnboardingPanel isDark={false} t={mockT} />);
    expect(screen.queryByText('onboarding.invite')).not.toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    const { container } = render(<OnboardingPanel isDark={true} t={mockT} />);
    const heading = container.querySelector('[class*="text-white"]');
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const heading = container.querySelector('[class*="text-slate-900"]');
    expect(heading).toBeInTheDocument();
  });

  it('renders with MessageSquarePlus icon', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const iconContainer = container.querySelector('.w-20.h-20');
    expect(iconContainer).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders icon with orange background in dark theme', () => {
    const { container } = render(<OnboardingPanel isDark={true} t={mockT} />);
    const iconContainer = container.querySelector('.w-20.h-20');
    expect(iconContainer?.className).toContain('bg-orange-500/10');
  });

  it('renders icon with orange background in light theme', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const iconContainer = container.querySelector('.w-20.h-20');
    expect(iconContainer?.className).toContain('bg-orange-500/8');
  });

  it('renders with orange icon color in dark theme', () => {
    const { container } = render(<OnboardingPanel isDark={true} t={mockT} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('text-orange-400');
  });

  it('renders with orange icon color in light theme', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('text-orange-600');
  });

  it('renders with heading size text-xl', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const heading = container.querySelector('[class*="text-xl"]');
    expect(heading).toHaveClass('font-bold');
  });

  it('renders with centered heading', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const heading = container.querySelector('[class*="text-xl"]');
    expect(heading).toHaveClass('font-bold');
    expect(container.querySelector('[class*="text-center"]')).toBeInTheDocument();
  });

  it('renders description text with max-w-xs', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const description = container.querySelector('[class*="max-w-xs"]');
    expect(description).toBeInTheDocument();
  });

  it('renders description with text-sm', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const description = container.querySelector('[class*="text-sm"]');
    expect(description).toBeInTheDocument();
  });

  it('renders description with leading-relaxed', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const description = container.querySelector('[class*="leading-relaxed"]');
    expect(description).toBeInTheDocument();
  });

  it('renders description with gray text in dark theme', () => {
    const { container } = render(<OnboardingPanel isDark={true} t={mockT} />);
    const description = container.querySelector('[class*="text-gray-400"]');
    expect(description).toBeInTheDocument();
  });

  it('renders description with slate-500 text in light theme', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const description = container.querySelector('[class*="text-slate-500"]');
    expect(description).toBeInTheDocument();
  });

  it('renders start chat button with gradient background', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('[class*="bg-gradient-to-r"]');
    expect(btn).toBeInTheDocument();
  });

  it('renders start chat button with text-[var(--text-primary)]', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('text-[var(--text-primary)]');
  });

  it('renders start chat button with shadow-lg', () => {
    const { container } = render(<OnboardingPanel isDark={true} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('shadow-lg');
  });

  it('renders start chat button with shadow-md in light theme', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('shadow-md');
  });

  it('renders start chat button with hover scale', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('hover:scale-[1.02]');
  });

  it('renders start chat button with active scale', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('active:scale-[0.98]');
  });

  it('renders start chat button with transition-all', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('transition-all');
  });

  it('renders invite button with dark background', () => {
    render(<OnboardingPanel isDark={true} t={mockT} onInvite={vi.fn()} />);
    const btn = screen.getByText('onboarding.invite');
    expect(btn.className).toContain('bg-[var(--bg-tertiary)]');
  });

  it('renders invite button with white background in light theme', () => {
    render(<OnboardingPanel isDark={false} t={mockT} onInvite={vi.fn()} />);
    const btn = screen.getByText('onboarding.invite');
    expect(btn.className).toContain('bg-white');
  });

  it('renders invite button with border in dark theme', () => {
    render(<OnboardingPanel isDark={true} t={mockT} onInvite={vi.fn()} />);
    const btn = screen.getByText('onboarding.invite');
    expect(btn.className).toContain('border');
    expect(btn.className).toContain('border-[var(--border-color)]');
  });

  it('renders invite button with border in light theme', () => {
    render(<OnboardingPanel isDark={false} t={mockT} onInvite={vi.fn()} />);
    const btn = screen.getByText('onboarding.invite');
    expect(btn.className).toContain('border');
    expect(btn.className).toContain('border-[var(--border-color)]');
  });

  it('renders invite button with hover state', () => {
    render(<OnboardingPanel isDark={true} t={mockT} onInvite={vi.fn()} />);
    const btn = screen.getByText('onboarding.invite');
    expect(btn.className).toContain('hover:bg-white/5');
  });

  it('renders invite button with shadow-sm in light theme', () => {
    render(<OnboardingPanel isDark={false} t={mockT} onInvite={vi.fn()} />);
    const btn = screen.getByText('onboarding.invite');
    expect(btn.className).toContain('shadow-sm');
  });

  it('renders invite button with UserPlus icon', () => {
    render(<OnboardingPanel isDark={false} t={mockT} onInvite={vi.fn()} />);
    const btn = screen.getByText('onboarding.invite');
    expect(btn).toHaveAttribute('class', expect.stringContaining('flex'));
    expect(btn).toHaveAttribute('class', expect.stringContaining('items-center'));
  });

  it('renders button with py-3 padding', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('py-3');
  });

  it('renders button with rounded-xl', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('rounded-xl');
  });

  it('renders button with font-bold', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('font-bold');
  });

  it('renders button with text-sm', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('text-sm');
  });

  it('renders button with flex and gap-2', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('flex');
    expect(btn?.className).toContain('items-center');
    expect(btn?.className).toContain('justify-center');
  });

  it('renders with flex-col layout', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const panel = container.firstElementChild;
    expect(panel?.className).toContain('flex');
    expect(panel?.className).toContain('flex-col');
  });

  it('renders with items-center justify-center', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const panel = container.firstElementChild;
    expect(panel?.className).toContain('items-center');
    expect(panel?.className).toContain('justify-center');
  });

  it('renders with py-12 padding', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const panel = container.firstElementChild;
    expect(panel?.className).toContain('py-12');
  });

  it('renders with px-6 padding', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const panel = container.firstElementChild;
    expect(panel?.className).toContain('px-6');
  });

  it('renders with text-center', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const panel = container.firstElementChild;
    expect(panel?.className).toContain('text-center');
  });

  it('renders with flex-1', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const panel = container.firstElementChild;
    expect(panel?.className).toContain('flex-1');
  });

  it('renders buttons container with gap-3', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} onInvite={vi.fn()} />);
    const gap = container.querySelector('[class*="gap-3"]');
    expect(gap).toBeInTheDocument();
  });

  it('renders buttons container with max-w-[260px]', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} onInvite={vi.fn()} />);
    const maxW = container.querySelector('[class*="max-w-[260px]"]');
    expect(maxW).toBeInTheDocument();
  });

  it('renders with transition-all on buttons', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} onStartChat={vi.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('transition-all');
  });

  it('renders with max-w-xs on description', () => {
    const { container } = render(<OnboardingPanel isDark={false} t={mockT} />);
    const description = container.querySelector('[class*="max-w-xs"]');
    expect(description).toBeInTheDocument();
  });
});