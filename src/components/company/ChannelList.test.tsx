import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChannelList } from './ChannelList';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        company_channels: 'Company Channels',
      };
      return translations[key] || key;
    },
    lang: 'ru',
    setLang: vi.fn(),
  }),
}));

const mockChannels = [
  {
    id: 'company-all',
    companyId: 'org_test',
    name: 'Весь офис',
    description: 'Общий канал для всех сотрудников',
    unread: 3,
    memberCount: 6,
    createdAt: Date.now(),
  },
  {
    id: 'company-dev',
    companyId: 'org_test',
    name: 'Разработка',
    description: 'Технические обсуждения',
    unread: 12,
    memberCount: 4,
    createdAt: Date.now(),
  },
];

describe('ChannelList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all channels', () => {
    render(<ChannelList channels={mockChannels} channelsLabel="Company Channels" t={(k: string) => k} />);
    expect(screen.getByText('Весь офис')).toBeInTheDocument();
    expect(screen.getByText('Разработка')).toBeInTheDocument();
  });

  it('calls onChannelClick when a channel card is clicked', () => {
    const onChannelClick = vi.fn();
    render(<ChannelList channels={mockChannels} channelsLabel="Company Channels" t={(k: string) => k} onChannelClick={onChannelClick} />);

    const cards = document.querySelectorAll('[class*="cursor-pointer"]');
    expect(cards.length).toBe(2);
    if (cards.length > 0) {
      fireEvent.click(cards[0]!);
      expect(onChannelClick).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onChannelClick with correct channel data', () => {
    const onChannelClick = vi.fn();
    render(<ChannelList channels={mockChannels} channelsLabel="Company Channels" t={(k: string) => k} onChannelClick={onChannelClick} />);

    const cards = document.querySelectorAll('[class*="cursor-pointer"]');
    if (cards.length > 0) {
      fireEvent.click(cards[0]!);
      expect(onChannelClick).toHaveBeenCalledWith(mockChannels[0]);
    }
  });

  it('does not call onChannelClick when undefined', () => {
    render(<ChannelList channels={mockChannels} channelsLabel="Company Channels" t={(k: string) => k} />);

    const cards = document.querySelectorAll('[class*="cursor-pointer"]');
    if (cards.length > 0) {
      fireEvent.click(cards[0]!);
      // Should not throw
    }
  });

  it('renders unread badges for channels with unread messages', () => {
    render(<ChannelList channels={mockChannels} channelsLabel="Company Channels" t={(k: string) => k} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders channel descriptions', () => {
    render(<ChannelList channels={mockChannels} channelsLabel="Company Channels" t={(k: string) => k} />);
    expect(screen.getByText('Общий канал для всех сотрудников')).toBeInTheDocument();
    expect(screen.getByText('Технические обсуждения')).toBeInTheDocument();
  });
});
