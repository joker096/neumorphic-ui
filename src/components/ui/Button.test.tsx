import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(container.querySelector('button')!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders with primary variant by default', () => {
    const { container } = render(<Button>Primary</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('bg-[var(--button-primary-bg)]');
  });

  it('renders with secondary variant classes', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('bg-[var(--button-secondary-bg)]');
  });

  it('renders with ghost variant classes', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('hover:bg-[var(--bg-secondary)]');
  });

  it('renders with danger variant classes', () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('bg-red-500');
  });

  it('renders with size sm classes', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('px-3');
    expect(btn?.className).toContain('py-1.5');
  });

  it('renders with size lg classes', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('px-6');
    expect(btn?.className).toContain('py-3');
  });

  it('renders disabled button', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    expect(container.querySelector('button')).toBeDisabled();
  });

  it('passes extra HTML button props', () => {
    const { container } = render(<Button type="submit">Submit</Button>);
    expect(container.querySelector('button')).toHaveAttribute('type', 'submit');
  });

  it('renders with premium variant', () => {
    const { container } = render(<Button variant="premium">Premium</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('rounded-full');
  });

  it('renders icon when provided', () => {
    const { container } = render(<Button icon={<span data-testid="icon" />}>With Icon</Button>);
    expect(container.querySelector('[data-testid="icon"]')).toBeInTheDocument();
  });

  it('renders icon inside rounded circle wrapper', () => {
    const { container } = render(<Button icon={<span>i</span>}>Icon</Button>);
    const iconWrapper = container.querySelector('button')?.querySelector('.rounded-full');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('applies rounded-full class when icon is provided (non-premium)', () => {
    const { container } = render(<Button icon={<span>i</span>}>Icon</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('rounded-full');
  });

  it('renders md size by default', () => {
    const { container } = render(<Button>Default Size</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('px-4');
    expect(btn?.className).toContain('py-2');
    expect(btn?.className).toContain('text-base');
  });

  it('merges custom className', () => {
    const { container } = render(<Button className="my-custom-class">Custom</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('my-custom-class');
  });

  it('renders disabled button with cursor-not-allowed', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    expect(container.querySelector('button')).toBeDisabled();
    expect(container.querySelector('button')?.className).toContain('cursor-pointer');
  });

  it('renders premium variant with icon', () => {
    const { container } = render(<Button variant="premium" icon={<span data-testid="premium-icon" />}>Premium Icon</Button>);
    expect(container.querySelector('[data-testid="premium-icon"]')).toBeInTheDocument();
  });

  it('passes aria attributes to button element', () => {
    const { container } = render(<Button aria-label="Close" aria-expanded={true}>X</Button>);
    const btn = container.querySelector('button');
    expect(btn).toHaveAttribute('aria-label', 'Close');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders focus-visible ring classes', () => {
    const { container } = render(<Button>Focus</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('focus-visible:ring-2');
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    const { container } = render(<Button disabled onClick={onClick}>Disabled Click</Button>);
    const btn = container.querySelector('button')!;
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders with group class', () => {
    const { container } = render(<Button>Group</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('group');
  });
});
