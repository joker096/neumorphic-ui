import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BotsSection } from './BotsSection';

const saveBotMock = vi.fn();
const deleteBotMock = vi.fn();
const createBotConfigMock = vi.fn();

vi.mock('../../lib', () => ({
  saveBot: (...args: unknown[]) => saveBotMock(...args),
  deleteBot: (...args: unknown[]) => deleteBotMock(...args),
}));

vi.mock('../../lib/bot', () => ({
  createBotConfig: (...args: unknown[]) => createBotConfigMock(...args),
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

describe('BotsSection - additional tests', () => {
  it('renders bot list group', () => {
    const bots = [{ id: '1', name: 'Bot1', token: '', publicKey: '', ownerId: '', commands: [], permissions: { readMessages: true, sendMessages: true, editMessages: false, deleteMessages: false, inlineKeyboard: false, readUserData: false, accessGroups: false, accessFiles: false }, isRunning: false }];
    const { container } = render(<BotsSection bots={bots} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('[class*="SettingsRow"]') || container.querySelector('[class*="rounded-md"]') || screen.getByText('Bot1')).toBeTruthy();
  });

  it('renders all bot actions', () => {
    const bots = [{ id: '1', name: 'Bot', token: '', publicKey: '', ownerId: '', commands: [], permissions: { readMessages: true, sendMessages: true, editMessages: false, deleteMessages: false, inlineKeyboard: false, readUserData: false, accessGroups: false, accessFiles: false }, isRunning: false }];
    const { container } = render(<BotsSection bots={bots} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
    expect(container.querySelector('svg') || container.querySelector('[class*="lucide-"]')).toBeInTheDocument();
  });

  it('renders add bot button', () => {
    render(<BotsSection bots={[]} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.addBot')).toBeInTheDocument();
  });

  it('renders section title', () => {
    render(<BotsSection bots={[]} setBots={vi.fn()} onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.bots')).toBeInTheDocument();
  });
});

describe('BotsSection - bot create/edit/toggle/remove (D1–D5 regress)', () => {
  beforeEach(() => {
    saveBotMock.mockClear();
    deleteBotMock.mockClear();
    createBotConfigMock.mockClear();
    createBotConfigMock.mockImplementation(async (name: string) => ({
      id: 'bot_test',
      name: name?.trim(),
      token: 'bot_test',
      publicKey: 'pk',
      ownerId: 'me',
      commands: [],
      permissions: { readMessages: true, sendMessages: true, editMessages: false, deleteMessages: false, inlineKeyboard: false, readUserData: false, accessGroups: false, accessFiles: false },
      isRunning: false,
    }));
  });

  const perms = { readMessages: true, sendMessages: true, editMessages: false, deleteMessages: false, inlineKeyboard: false, readUserData: false, accessGroups: false, accessFiles: false };
  const fixture = (over: Record<string, unknown> = {}) => ({ id: '1', name: 'HelperBot', token: '', publicKey: '', ownerId: 'me', commands: [], permissions: perms, isRunning: false, ...over });

  it('creates a bot via CreateBotModal and persists it', async () => {
    const setBots = vi.fn();
    render(<BotsSection bots={[]} setBots={setBots} onBack={vi.fn()} t={(k: string) => k} />);

    fireEvent.click(screen.getByText('settings.addBot'));
    const input = screen.getByPlaceholderText('createBot.namePlaceholder');
    fireEvent.change(input, { target: { value: '  HelperBot  ' } });
    fireEvent.click(screen.getByLabelText('createBot.generate'));

    await waitFor(() => expect(createBotConfigMock).toHaveBeenCalledWith('  HelperBot  '));
    await waitFor(() => expect(saveBotMock).toHaveBeenCalledTimes(1));
    expect(saveBotMock.mock.calls[0][0]).toMatchObject({ name: 'HelperBot', ownerId: 'me' });
  });

  it('edits a bot: row opens editor, save persists updated bot', async () => {
    const setBots = vi.fn();
    render(<BotsSection bots={[fixture()]} setBots={setBots} onBack={vi.fn()} t={(k: string) => k} />);

    fireEvent.click(screen.getByText('HelperBot'));
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'RenamedBot' } });
    fireEvent.click(screen.getByText('common.save'));

    await waitFor(() => expect(saveBotMock).toHaveBeenCalledWith(expect.objectContaining({ id: '1', name: 'RenamedBot' })));
    const updater = setBots.mock.calls[0][0] as (prev: unknown[]) => unknown[];
    expect(updater([fixture()])).toEqual([expect.objectContaining({ id: '1', name: 'RenamedBot' })]);
  });

  it('toggles bot running state via switch (not row click)', () => {
    const setBots = vi.fn();
    render(<BotsSection bots={[fixture()]} setBots={setBots} onBack={vi.fn()} t={(k: string) => k} />);

    fireEvent.click(screen.getByRole('switch'));

    const updater = setBots.mock.calls[0][0] as (prev: unknown[]) => unknown[];
    expect(updater([fixture()])).toEqual([expect.objectContaining({ isRunning: true })]);
    expect(saveBotMock).toHaveBeenCalledWith(expect.objectContaining({ id: '1', isRunning: true }));
  });

  it('removes bot via trash + confirm', () => {
    const setBots = vi.fn();
    render(<BotsSection bots={[fixture()]} setBots={setBots} onBack={vi.fn()} t={(k: string) => k} />);

    fireEvent.click(screen.getByLabelText('settings.removeBot'));
    fireEvent.click(screen.getByText('settings.remove'));

    const updater = setBots.mock.calls[0][0] as (prev: unknown[]) => unknown[];
    expect(updater([fixture()])).toEqual([]);
    expect(deleteBotMock).toHaveBeenCalledWith('1');
  });

  it('row click opens editor, not toggle', () => {
    const setBots = vi.fn();
    render(<BotsSection bots={[fixture()]} setBots={setBots} onBack={vi.fn()} t={(k: string) => k} />);

    fireEvent.click(screen.getByText('HelperBot'));

    expect(screen.getByText('bot.editTitle')).toBeInTheDocument();
    expect(setBots).not.toHaveBeenCalled();
  });
});
