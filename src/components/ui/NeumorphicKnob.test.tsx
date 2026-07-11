import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NeumorphicKnob } from './NeumorphicKnob';

function getKnob(className = '') {
  const { container } = render(<NeumorphicKnob className={className} />);
  return container.firstElementChild as HTMLElement;
}

describe('NeumorphicKnob', () => {
  it('renders correctly', () => {
    expect(getKnob()).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    expect(getKnob('my-custom-class')).toHaveClass('my-custom-class');
  });

  it('has fixed size w-[18px] h-[18px]', () => {
    const el = getKnob();
    expect(el).toHaveClass('w-[18px]');
    expect(el).toHaveClass('h-[18px]');
  });

  it('is rounded full', () => {
    expect(getKnob()).toHaveClass('rounded-full');
  });

  it('uses neumorphic raised shadow', () => {
    expect(getKnob()).toHaveAttribute('class', expect.stringContaining('shadow-[-2px_-2px_5px_rgba(255,255,255,0.9)'));
  });

  it('renders with default classes when no custom className', () => {
    const el = getKnob();
    expect(el).toHaveAttribute('class', expect.stringContaining('w-[18px]'));
    expect(el).toHaveAttribute('class', expect.stringContaining('rounded-full'));
  });
});
