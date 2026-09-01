import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BotCommandList } from './BotCommandList';
import type { BotCommand } from '../../../services/types';

const COMMANDS: BotCommand[] = [
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Show help' },
];

describe('BotCommandList', () => {
  it('renders nothing for an empty command list', () => {
    const { container } = render(<BotCommandList commands={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the commands heading', () => {
    render(<BotCommandList commands={COMMANDS} />);
    expect(screen.getByText('Команды')).toBeInTheDocument();
  });

  it('renders each command with a /command code and its description', () => {
    const { container } = render(<BotCommandList commands={COMMANDS} />);
    const codes = Array.from(container.querySelectorAll('code'));
    expect(codes.map((el) => el.textContent)).toEqual(['/start', '/help']);
    expect(screen.getByText('Start the bot')).toBeInTheDocument();
    expect(screen.getByText('Show help')).toBeInTheDocument();
  });

  it('applies the dark background to command rows when isDark is set', () => {
    const { container } = render(<BotCommandList commands={COMMANDS} isDark />);
    const rows = Array.from(container.querySelectorAll('code')).map((el) => el.parentElement);
    rows.forEach((row) => expect(row).toHaveClass('bg-[var(--bg-tertiary)]'));
  });

  it('applies the light bordered row style by default', () => {
    const { container } = render(<BotCommandList commands={COMMANDS} />);
    const rows = Array.from(container.querySelectorAll('code')).map((el) => el.parentElement);
    rows.forEach((row) => {
      expect(row).toHaveClass('bg-white');
      expect(row).toHaveClass('border');
    });
  });
});
