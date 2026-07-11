import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('lucide-react', () => ({ X: 'div', Bot: 'div', Check: 'div', Key: 'div' }));

const mockSetBots = vi.fn();
const mockStore = { bots: [], setBots: mockSetBots };
vi.mock('../../store', () => ({
  useAppStore: (selector?: any) => selector ? selector(mockStore) : mockStore,
  BotConfig: {},
  DEFAULT_BOT_PERMISSIONS: { read: true, write: false },
}));

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

import { CreateBotModal } from './CreateBotModal';

describe('CreateBotModal', () => {
  it('renders title and form fields', () => {
    render(<CreateBotModal onClose={vi.fn()} />);
    expect(screen.getByText('createBot.title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('createBot.namePlaceholder')).toBeInTheDocument();
  });

  it('renders info message', () => {
    render(<CreateBotModal onClose={vi.fn()} />);
    expect(screen.getByText('createBot.info')).toBeInTheDocument();
  });

  it('renders generate button', () => {
    render(<CreateBotModal onClose={vi.fn()} />);
    expect(screen.getByText('createBot.generate')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<CreateBotModal onClose={onClose} />);
    const closeBtn = container.querySelector('.neu-button')!;
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
