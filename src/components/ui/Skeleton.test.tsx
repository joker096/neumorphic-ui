import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders default 4 rows with aria-busy', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(12);
  });

  it('renders custom row count', () => {
    const { container } = render(<Skeleton rows={2} />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(6);
  });
});
