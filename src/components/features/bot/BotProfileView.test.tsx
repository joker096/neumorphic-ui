import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BotProfileView } from './BotProfileView';

const mockBot = vi.hoisted(() => ({ getBotProfile: vi.fn() }));

vi.mock('../../../services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services')>();
  return { ...actual, useServices: () => ({ bot: mockBot }) };
});

describe('BotProfileView', () => {
  beforeEach(() => {
    mockBot.getBotProfile.mockReset();
  });

  it('re-fetches the profile when retry is clicked (D5 regression)', async () => {
    mockBot.getBotProfile.mockRejectedValue(new Error('boom'));
    render(<BotProfileView botId="b1" />);
    const retry = await screen.findByRole('button', { name: 'ui.retry' });
    expect(mockBot.getBotProfile).toHaveBeenCalledTimes(1);
    fireEvent.click(retry);
    await waitFor(() => expect(mockBot.getBotProfile).toHaveBeenCalledTimes(2));
  });
});
