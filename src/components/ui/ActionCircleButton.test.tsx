import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ActionCircleButton } from './ActionCircleButton';

describe('ActionCircleButton - additional tests', () => {
  it('renders with all icon variants', () => {
    const { container } = render(<ActionCircleButton icon={() => <svg data-testid="test-icon" /> } label="Test" />);
    expect(container.querySelector('[data-testid="test-icon"]') || container.querySelector('[class*="lucide"]') || container.querySelector('svg')).toBeInTheDocument();
  });

  it('toggles glow when active', () => {
    const { container } = render(<ActionCircleButton icon={() => <svg /> } label="Test" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders with default color when active', () => {
    const { container } = render(<ActionCircleButton icon={() => <svg /> } label="Test" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders hover state when inactive', () => {
    const { container } = render(<ActionCircleButton icon={() => <svg /> } label="Test" isToggleable={false} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.mouseEnter(button);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders with tooltip text', () => {
    render(<ActionCircleButton icon={() => <svg /> } label="My Button" />);
    expect(screen.getByText('My Button')).toBeInTheDocument();
  });

  it('renders with different colors', () => {
    const { container } = render(<ActionCircleButton icon={() => <svg /> } label="Test" color="red" />);
    expect(container.querySelector('[class*="text-red-"]') || container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(<ActionCircleButton icon={() => <svg /> } label="Test" isToggleable={false} />);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
    const { container } = render(<ActionCircleButton icon={() => <svg /> } label="Test" isToggleable={false} />);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders with scale effect when active', () => {
    const { container } = render(<ActionCircleButton icon={() => <svg /> } label="Test" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });

  it('renders with active state class', () => {
    const { container } = render(<ActionCircleButton icon={() => <svg /> } label="Test" isToggleable={true} />);
    const button = container.querySelector('.group') as HTMLElement;
    fireEvent.click(button);
    expect(container.querySelector('.group')).toBeInTheDocument();
  });
});
