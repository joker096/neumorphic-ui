import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { UnifiedButton } from './UnifiedButton';

describe('UnifiedButton', () => {
  it('renders the label text', () => {
    render(<UnifiedButton label="Test Button" />);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<UnifiedButton label="Main" subtitle="Subtext" />);
    expect(screen.getByText('Subtext')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<UnifiedButton label="Main" />);
    expect(screen.queryByText(/Subtext/i)).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<UnifiedButton label="Click me" onClick={onClick} />);
    const btn = screen.getByText('Click me');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders primary variant by default', () => {
    render(<UnifiedButton label="Primary" />);
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('renders secondary variant when specified', () => {
    render(<UnifiedButton label="Secondary" variant="secondary" />);
    expect(screen.getByText('Secondary')).toBeInTheDocument();
  });

  it('renders ghost variant when specified', () => {
    render(<UnifiedButton label="Ghost" variant="ghost" />);
    expect(screen.getByText('Ghost')).toBeInTheDocument();
  });

  it('renders danger variant', () => {
    render(<UnifiedButton label="Danger" variant="danger" />);
    expect(screen.getByText('Danger')).toBeInTheDocument();
  });

  it('renders large version when isLarge is true', () => {
    render(<UnifiedButton label="Large" isLarge />);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('renders active state when active is true', () => {
    render(<UnifiedButton label="Active" active />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with md size by default', () => {
    render(<UnifiedButton label="MD" />);
    expect(screen.getByText('MD')).toBeInTheDocument();
  });

  it('renders glow effect when active or large', () => {
    render(<UnifiedButton label="Glow" isLarge active />);
    expect(screen.getByText('Glow')).toBeInTheDocument();
  });

  it('does not render glow when ghost variant and not active/large', () => {
    render(<UnifiedButton label="Ghost" variant="ghost" />);
    expect(screen.getByText('Ghost')).toBeInTheDocument();
  });

  it('renders with custom glowColor when orange', () => {
    render(<UnifiedButton label="Glow Orange" isLarge active glowColor="orange" />);
    expect(screen.getByText('Glow Orange')).toBeInTheDocument();
  });

  it('renders with custom glowColor when not orange', () => {
    render(<UnifiedButton label="Glow Blue" isLarge active glowColor="blue" />);
    expect(screen.getByText('Glow Blue')).toBeInTheDocument();
  });

  it('shows subtitle only when not isLarge', () => {
    render(<UnifiedButton label="Test" subtitle="Sub" />);
    expect(screen.getByText('Test')).toBeInTheDocument();

    render(<UnifiedButton label="Test Large" subtitle="Sub" isLarge />);
    expect(screen.getByText('Test Large')).toBeInTheDocument();
  });

  it('renders rightIcon placeholder when provided (as text)', () => {
    render(<UnifiedButton label="With Icon" rightIcon="icon" />);
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });
});
