import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BackButton } from './BackButton';

describe('BackButton - additional tests', () => {
  it('renders with text', () => {
    render(<BackButton />);
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('renders with chevron icon', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with cursor pointer', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button').classList.contains('cursor-pointer')).toBeTruthy();
  });

  it('renders with transition classes', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button').classList.contains('transition-colors')).toBeTruthy();
  });

  it('renders with gap', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button').classList.contains('gap-1')).toBeTruthy();
  });

  it('renders with text-sm', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button').classList.contains('text-sm')).toBeTruthy();
  });

  it('renders with font-medium', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button').classList.contains('font-medium')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<BackButton className="custom" />);
    expect(container.querySelector('button').classList.contains('custom')).toBeTruthy();
  });

  it('renders with onClick callback', () => {
    const onClick = vi.fn();
    render(<BackButton onClick={onClick} />);
    fireEvent.click(screen.getByText('Back'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders without onClick', () => {
    render(<BackButton />);
    fireEvent.click(screen.getByText('Back'));
    // Should not crash
    expect(screen.getByText('Back')).toBeInTheDocument();
  });
});
