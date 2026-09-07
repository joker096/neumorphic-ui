import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MiniApp } from './MiniAppView';

const mockBot = vi.hoisted(() => ({ getMiniApp: vi.fn() }));

vi.mock('../../../services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services')>();
  return { ...actual, useServices: () => ({ bot: mockBot }) };
});

describe('MiniApp', () => {
  beforeEach(() => {
    mockBot.getMiniApp.mockReset();
  });

  it('re-fetches the mini-app when retry is clicked (D5 regression)', async () => {
    mockBot.getMiniApp.mockRejectedValue(new Error('boom'));
    render(<MiniApp botId="b1" />);
    const retry = await screen.findByRole('button', { name: 'ui.retry' });
    expect(mockBot.getMiniApp).toHaveBeenCalledTimes(1);
    fireEvent.click(retry);
    await waitFor(() => expect(mockBot.getMiniApp).toHaveBeenCalledTimes(2));
  });
});
