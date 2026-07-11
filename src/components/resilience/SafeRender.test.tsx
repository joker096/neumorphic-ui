import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.spyOn(console, 'error').mockImplementation(() => {});

import { SafeRender } from './SafeRender';

const GoodChild = () => <div>Safe Content</div>;
const BadChild = () => { throw new Error('Crash'); };

describe('SafeRender', () => {
  it('renders children when no error', () => {
    render(<SafeRender><GoodChild /></SafeRender>);
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('catches errors and shows default fallback', () => {
    render(<SafeRender><BadChild /></SafeRender>);
    expect(screen.getByText('error.somethingWentWrong')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    render(<SafeRender fallback={<div>Custom Fallback</div>}><BadChild /></SafeRender>);
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
  });
});
