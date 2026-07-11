import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { ErrorBoundary } from './ErrorBoundary';

const GoodChild = () => <div>Good Child</div>;
const BadChild = () => { throw new Error('Test error'); };

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
    expect(screen.getByText('error.somethingWentWrong')).toBeInTheDocument();
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
    expect(screen.getByText('error.tryAgain')).toBeInTheDocument();
  });

  it('shows error message in details', () => {
    render(<ErrorBoundary><BadChild /></ErrorBoundary>);
    expect(screen.getByText('error.errorDetails')).toBeInTheDocument();
  });
});
