import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { InlineKeyboard } from './InlineKeyboard';
import { ServiceNotConfiguredError } from '../../../services/types';
import type { InlineKeyboardButton } from '../../../services/types';

const mockBot = vi.hoisted(() => ({
  getInlineKeyboard: vi.fn(),
  handleInlineButton: vi.fn(),
}));

vi.mock('../../../services', () => ({
  useServices: () => ({ bot: mockBot }),
}));

const ROWS: InlineKeyboardButton[][] = [
  [
    { text: 'Buy', data: 'buy' },
    { text: 'Open site', url: 'https://example.com' },
  ],
  [{ text: 'Again', data: 'again' }],
];

describe('InlineKeyboard', () => {
  beforeEach(() => {
    mockBot.getInlineKeyboard.mockReset();
    mockBot.handleInlineButton.mockReset();
  });

  it('renders the provided rows as buttons', () => {
    render(<InlineKeyboard botId="b1" messageId="m1" rows={ROWS} />);
    expect(screen.getByRole('button', { name: 'Buy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open site' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Again' })).toBeInTheDocument();
  });

  it('does not fetch rows when rows prop is provided', () => {
    render(<InlineKeyboard botId="b1" messageId="m1" rows={ROWS} />);
    expect(mockBot.getInlineKeyboard).not.toHaveBeenCalled();
  });

  it('fetches rows via bot.getInlineKeyboard when rows prop is missing', async () => {
    mockBot.getInlineKeyboard.mockResolvedValue(ROWS);
    render(<InlineKeyboard botId="b9" messageId="m9" />);
    expect(mockBot.getInlineKeyboard).toHaveBeenCalledWith('b9', 'm9');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Buy' })).toBeInTheDocument());
  });

  it('renders empty placeholder while fetch is pending', () => {
    mockBot.getInlineKeyboard.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<InlineKeyboard botId="b1" messageId="m1" />);
    expect(container.firstElementChild).toHaveClass('h-8');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps the placeholder when the fetch rejects', async () => {
    mockBot.getInlineKeyboard.mockRejectedValue(new Error('no'));
    const { container } = render(<InlineKeyboard botId="b1" messageId="m1" />);
    await waitFor(() => expect(container.firstElementChild).toHaveClass('h-8'));
  });

  it('renders nothing when data is an empty list', () => {
    const { container } = render(<InlineKeyboard botId="b1" messageId="m1" rows={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls bot.handleInlineButton for a data button and shows processed feedback', async () => {
    mockBot.handleInlineButton.mockResolvedValue(undefined);
    render(<InlineKeyboard botId="b1" messageId="m1" rows={ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    await waitFor(() =>
      expect(screen.getByText('«Buy» — обработано')).toBeInTheDocument(),
    );
    expect(mockBot.handleInlineButton).toHaveBeenCalledWith('b1', 'm1', { text: 'Buy', data: 'buy' });
  });

  it('opens url buttons in a new window without calling the bot', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<InlineKeyboard botId="b1" messageId="m1" rows={ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open site' }));
    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    expect(mockBot.handleInlineButton).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('blocks non-http(s) url buttons from opening', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const evil: InlineKeyboardButton[][] = [
      [{ text: 'Evil', url: 'javascript:alert(1)' }],
      [{ text: 'Data', url: 'data:text/html,<script>1</script>' }],
    ];
    render(<InlineKeyboard botId="b1" messageId="m1" rows={evil} />);
    fireEvent.click(screen.getByRole('button', { name: 'Evil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Data' }));
    expect(open).not.toHaveBeenCalled();
    expect(mockBot.handleInlineButton).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('shows the not-configured message when the bot is not configured', async () => {
    mockBot.handleInlineButton.mockRejectedValue(new ServiceNotConfiguredError('bot'));
    render(<InlineKeyboard botId="b1" messageId="m1" rows={ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    await waitFor(() =>
      expect(screen.getByText('Интеграция бота не подключена')).toBeInTheDocument(),
    );
  });

  it('shows the generic error message on other failures', async () => {
    mockBot.handleInlineButton.mockRejectedValue(new Error('boom'));
    render(<InlineKeyboard botId="b1" messageId="m1" rows={ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    await waitFor(() =>
      expect(screen.getByText('Ошибка обработки кнопки')).toBeInTheDocument(),
    );
  });

  it('uses the dark background class when isDark is set', () => {
    const { container } = render(<InlineKeyboard botId="b1" messageId="m1" rows={ROWS} isDark />);
    expect(container.querySelector('button')).toHaveClass('bg-[var(--accent)]/10');
  });

  it('uses the light background class by default', () => {
    const { container } = render(<InlineKeyboard botId="b1" messageId="m1" rows={ROWS} />);
    expect(container.querySelector('button')).toHaveClass('bg-[var(--accent)]/5');
  });
});
