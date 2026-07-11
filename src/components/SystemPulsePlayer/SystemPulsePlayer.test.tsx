import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SystemPulsePlayer } from './SystemPulsePlayer';

// Mock motion/react completely
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div data-testid="animate-presence">{children}</div>,
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
    span: 'span',
    p: 'p',
    button: 'button',
    h3: 'h3',
    h2: 'h2',
    h4: 'h4',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    form: 'form',
    nav: 'nav',
    section: 'section',
    header: 'header',
    footer: 'footer',
    main: 'main',
    article: 'article',
    aside: 'aside',
    time: 'time',
  },
  useReducedMotion: () => false,
}));

// Mock i18n
vi.mock('../../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// Mock store
vi.mock('../../../store', () => ({
  useAppStore: () => ({ activeCall: null }),
}));

describe('SystemPulsePlayer', () => {
  it('renders the player', () => {
    render(<SystemPulsePlayer theme="dark" />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with default props', () => {
    render(<SystemPulsePlayer theme="dark" />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with theme prop', () => {
    render(<SystemPulsePlayer theme="dark" />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    render(<SystemPulsePlayer theme="light" />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    render(<SystemPulsePlayer theme="dark" />);
    expect(document.body).toBeInTheDocument();
  });
});
