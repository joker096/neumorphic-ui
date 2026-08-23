import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { ErrorBoundary } from './ErrorBoundary';
import { forceFreshReload } from '../../lib/chunk-reload';

vi.mock('../../lib/chunk-reload', async () => {
  const actual = await vi.importActual<typeof import('../../lib/chunk-reload')>('../../lib/chunk-reload');
  return { ...actual, forceFreshReload: vi.fn(() => true) };
});

const GoodChild = () => <div>Good Child</div>;
const BadChild = () => { throw new Error('Test error'); };
const ChunkChild = () => {
  throw new Error('Failed to fetch dynamically imported module: https://example.com/assets/Foo-abc123.js');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error', () => {
    render(<ErrorBoundary><GoodChild /></ErrorBoundary>);
    expect(screen.getByText('Good Child')).toBeInTheDocument();
  });

  it('renders fallback UI on error', () => {
    render(<ErrorBoundary><BadChild /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom fallback on error', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error</div>}>
        <BadChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('renders retry button in default fallback', () => {
    render(<ErrorBoundary><BadChild /></ErrorBoundary>);
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('shows error message in details', () => {
    render(<ErrorBoundary><BadChild /></ErrorBoundary>);
    expect(screen.getByText('Error details')).toBeInTheDocument();
  });

  it('forces a fresh reload on chunk load error', () => {
    vi.mocked(forceFreshReload).mockClear();
    render(<ErrorBoundary><ChunkChild /></ErrorBoundary>);
    expect(screen.getByText('Reload page')).toBeInTheDocument();
    expect(forceFreshReload).toHaveBeenCalledWith(false);
  });

  it('does not force reload on regular errors', () => {
    vi.mocked(forceFreshReload).mockClear();
    render(<ErrorBoundary><BadChild /></ErrorBoundary>);
    expect(forceFreshReload).not.toHaveBeenCalled();
  });
});
