import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NavItemButton } from './NavItemButton';

const Icon = ({ size, className, strokeWidth }: { size?: number; className?: string; strokeWidth?: number }) => (
  <span data-testid="nav-icon" data-size={size} data-sw={strokeWidth} className={className}>i</span>
);

const baseProps = {
  active: false,
  label: 'Chats',
  icon: Icon,
  onClick: vi.fn(),
  variant: 'sidebar' as const,
};

describe('NavItemButton', () => {
  it('renders a button with accessible label', () => {
    render(<NavItemButton {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Chats' })).toBeInTheDocument();
  });

  it('marks active button with aria-current="page"', () => {
    const { rerender } = render(<NavItemButton {...baseProps} active />);
    expect(screen.getByRole('button', { name: 'Chats' })).toHaveAttribute('aria-current', 'page');
    rerender(<NavItemButton {...baseProps} active={false} />);
    expect(screen.getByRole('button', { name: 'Chats' })).not.toHaveAttribute('aria-current');
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    render(<NavItemButton {...baseProps} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Chats' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders no badge when count is zero', () => {
    render(<NavItemButton {...baseProps} badgeCount={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders badge count when positive', () => {
    render(<NavItemButton {...baseProps} badgeCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('caps badge display at 99+', () => {
    render(<NavItemButton {...baseProps} badgeCount={150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
    expect(screen.queryByText('150')).not.toBeInTheDocument();
  });

  it('renders label text only for eco variant', () => {
    render(<NavItemButton {...baseProps} variant="eco" />);
    expect(screen.getByText('Chats')).toBeInTheDocument();
  });

  it('omits label text for bottom and sidebar variants', () => {
    const { container, rerender } = render(<NavItemButton {...baseProps} variant="bottom" />);
    expect(container.textContent).not.toContain('Chats');
    rerender(<NavItemButton {...baseProps} variant="sidebar" />);
    expect(container.textContent).not.toContain('Chats');
  });

  it('renders the icon for every variant', () => {
    const { rerender } = render(<NavItemButton {...baseProps} variant="bottom" />);
    expect(screen.getByTestId('nav-icon')).toBeInTheDocument();
    rerender(<NavItemButton {...baseProps} variant="eco" />);
    expect(screen.getByTestId('nav-icon')).toBeInTheDocument();
  });

  it('thickens icon stroke on active state', () => {
    render(<NavItemButton {...baseProps} active />);
    expect(screen.getByTestId('nav-icon')).toHaveAttribute('data-sw', '2.5');
  });
});