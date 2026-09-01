import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { lazyWithFallback } from './lazy';

describe('lazyWithFallback', () => {
  it('renders fallback then the lazy component', async () => {
    const Comp = ({ label }: { label: string }) => <span>{label}</span>;
    const loader = vi.fn(async () => ({ default: Comp }));
    const Wrapped = lazyWithFallback(loader, <div>loading…</div>);

    render(<Wrapped label="hi" />);
    expect(screen.getByText('loading…')).toBeTruthy();

    await waitFor(() => expect(screen.getByText('hi')).toBeTruthy());
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
