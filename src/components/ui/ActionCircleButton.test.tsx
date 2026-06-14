import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActionCircleButton } from './ActionCircleButton';
import { Plus } from 'lucide-react';

describe('ActionCircleButton', () => {
  it('renders button with label', () => {
    render(<ActionCircleButton icon={Plus} label="Test" theme="dark" />);
    expect(screen.getByText('Test')).toBeTruthy();
  });
});