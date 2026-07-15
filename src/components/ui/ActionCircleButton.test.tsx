import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ActionCircleButton } from './ActionCircleButton';

const MockIcon = ({ className }: { className?: string }) => <svg data-testid="mock-icon" className={className} />;

describe('ActionCircleButton - additional tests', () => {
  it('renders with all icon variants', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Test" />);
    expect(container.querySelector('[data-testid="mock-icon"]')).toBeInTheDocument();
  });

  it('toggles glow when active', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Test" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    const glow = container.querySelector('[class*="animate-pulse"]');
    expect(glow).toBeInTheDocument();
  });

  it('renders with default color when active', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Test" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    const label = screen.getByText('Test');
    expect(label.className).toContain('text-orange-400');
  });

  it('renders hover state when inactive', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Test" isToggleable={false} />);
    const label = screen.getByText('Test');
    expect(label.className).toContain('group-hover:text-gray-300');
  });

  it('renders with tooltip text', () => {
    render(<ActionCircleButton icon={MockIcon} label="My Button" />);
    expect(screen.getByText('My Button')).toBeInTheDocument();
  });

  it('renders with different colors', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Test" color="red" />);
    const icon = container.querySelector('[data-testid="mock-icon"]');
    expect(icon?.getAttribute('class')).toContain('text-red');
  });

  it('renders light theme styles', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Test" theme="light" isToggleable={false} />);
    const circle = container.querySelector('[class*="shadow-\\[-6px"]');
    expect(circle).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Test" theme="dark" isToggleable={false} />);
    const circle = container.querySelector('[class*="shadow-\\[0_12px"]');
    expect(circle).toBeInTheDocument();
  });

  it('renders with scale effect when active', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Test" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    const circle = container.querySelector('[class*="scale-95"]');
    expect(circle).toBeInTheDocument();
  });

  it('renders with active state label color', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Test" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    const label = screen.getByText('Test');
    expect(label.className).toContain('text-orange-400');
  });

  it('renders label text', () => {
    render(<ActionCircleButton icon={MockIcon} label="My Action" />);
    expect(screen.getByText('My Action')).toBeInTheDocument();
  });

  it('does not toggle when isToggleable is false', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="NoToggle" isToggleable={false} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    const circle = container.querySelector('[class*="shadow-[inset"]');
    expect(circle).toBeNull();
  });

  it('toggles active state on click when isToggleable is true', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Toggleable" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    const activeCircle = container.querySelector('[class*="shadow-[inset_0_12px"]');
    expect(activeCircle).toBeInTheDocument();
  });

  it('renders with dark theme by default', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Dark" />);
    const iconWrapper = container.querySelector('[class*="shadow-\\[0_12px"]');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('renders with light theme when specified', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Light" theme="light" />);
    const iconWrapper = container.querySelector('[class*="shadow-\\[-6px"]');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('renders with color red', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Red" color="red" />);
    const icon = container.querySelector('[data-testid="mock-icon"]');
    expect(icon?.getAttribute('class')).toContain('text-red');
  });

  it('renders with color yellow', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Yellow" color="yellow" />);
    const icon = container.querySelector('[data-testid="mock-icon"]');
    expect(icon?.getAttribute('class')).toContain('text-amber');
  });

  it('renders with color green', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Green" color="green" />);
    const icon = container.querySelector('[data-testid="mock-icon"]');
    expect(icon?.getAttribute('class')).toContain('text-teal');
  });

  it('renders with color blue', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Blue" color="blue" />);
    const icon = container.querySelector('[data-testid="mock-icon"]');
    expect(icon?.getAttribute('class')).toContain('text-blue');
  });

  it('renders animate-pulse glow ring when active', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Pulse" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    const glow = container.querySelector('[class*="animate-pulse"]');
    expect(glow).toBeInTheDocument();
  });

  it('renders uppercase label', () => {
    render(<ActionCircleButton icon={MockIcon} label="uppercase" />);
    const label = screen.getByText('uppercase');
    expect(label.className).toContain('uppercase');
  });

  it('renders with w-[80px] container', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Width" />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('w-[80px]');
  });

  it('has pointer cursor', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="Pointer" />);
    const el = container.querySelector('[class*="cursor-pointer"]');
    expect(el).toBeInTheDocument();
  });

  it('toggles back on second click', () => {
    const { container } = render(<ActionCircleButton icon={MockIcon} label="ToggleBack" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    fireEvent.click(button);
    const inactiveShadow = container.querySelector('[class*="shadow-\\[0_12px"]');
    expect(inactiveShadow).toBeInTheDocument();
  });
});
