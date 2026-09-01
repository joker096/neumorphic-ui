import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DataState } from './DataState';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

describe('DataState', () => {
  it('renders children when loaded', () => {
    render(<DataState status="loaded"><div>content</div></DataState>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders partial banner with title and children', () => {
    render(<DataState status="partial" title="Some data missing"><div>content</div></DataState>);
    expect(screen.getByText('Some data missing')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders title when loading', () => {
    render(<DataState status="loading" title="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders empty state with description and action', () => {
    const onClick = vi.fn();
    render(<DataState status="empty" title="Nothing here" description="Add something" action={{ label: 'Create', onClick }} />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add something')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Create'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders empty with inbox icon by default, ignoring locale-sniffed titles', () => {
    render(<DataState status="empty" title="No results" />);
    expect(document.querySelector('[class*="lucide-inbox"]')).toBeInTheDocument();
    expect(document.querySelector('[class*="lucide-search"]')).not.toBeInTheDocument();
  });

  it('renders empty with search icon when emptyIcon="search"', () => {
    render(<DataState status="empty" emptyIcon="search" title="Nothing found" />);
    expect(document.querySelector('[class*="lucide-search"]')).toBeInTheDocument();
    expect(document.querySelector('[class*="lucide-inbox"]')).not.toBeInTheDocument();
  });

  it('renders error with description, code and retry button', () => {
    const retry = vi.fn();
    render(<DataState status="error" title="Something went wrong" description="The request failed on the server." code="ERR_42" retryAction={retry} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('The request failed on the server.')).toBeInTheDocument();
    expect(screen.getByText('ERR_42')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ui.retry' }));
    expect(retry).toHaveBeenCalled();
  });

  it('renders offline state with retry and action', () => {
    const retry = vi.fn();
    const onClick = vi.fn();
    render(<DataState status="offline" title="No connection" retryAction={retry} action={{ label: 'View cached', onClick }} />);
    fireEvent.click(screen.getByRole('button', { name: 'ui.retry' }));
    expect(retry).toHaveBeenCalled();
    fireEvent.click(screen.getByText('View cached'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders unauthorized state with description and action', () => {
    const onClick = vi.fn();
    render(<DataState status="unauthorized" title="Sign in required" description="You must be signed in" action={{ label: 'Sign in', onClick }} />);
    expect(screen.getByText('Sign in required')).toBeInTheDocument();
    expect(screen.getByText('You must be signed in')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Sign in'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders restricted state', () => {
    render(<DataState status="restricted" title="Access restricted" description="You do not have permission" />);
    expect(screen.getByText('Access restricted')).toBeInTheDocument();
    expect(screen.getByText('You do not have permission')).toBeInTheDocument();
  });

  it('renders deleted state', () => {
    render(<DataState status="deleted" title="Deleted item" description="This item was removed" />);
    expect(screen.getByText('Deleted item')).toBeInTheDocument();
    expect(screen.getByText('This item was removed')).toBeInTheDocument();
  });
});
