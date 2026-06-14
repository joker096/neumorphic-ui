import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NeumorphicKnob } from './NeumorphicKnob';

describe('NeumorphicKnob', () => {
  it('renders a div with rounded-full class', () => {
    const { container } = render(<NeumorphicKnob />);
    const div = container.querySelector('div');
    expect(div).toBeTruthy();
    expect(div!.className).toContain('rounded-full');
  });

  it('applies custom className', () => {
    const { container } = render(<NeumorphicKnob className="custom-class" />);
    const div = container.querySelector('div');
    expect(div!.className).toContain('custom-class');
  });

  it('renders with default className when none provided', () => {
    const { container } = render(<NeumorphicKnob />);
    const div = container.querySelector('div');
    expect(div!.className).toContain('w-[18px]');
    expect(div!.className).toContain('h-[18px]');
  });
});
