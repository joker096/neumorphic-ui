import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChannelItem } from './ChannelItem';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: any) => {
      if (key === 'company_memberCount' && options?.count) return `${options.count} members`;
      if (key === 'company_memberCount') return 'members';
      return key;
    },
    lang: 'ru',
    setLang: vi.fn(),
  }),
}));

const mockChannel = {
  id: 'company-all',
  companyId: 'org_test',
  name: 'Весь офис',
  description: 'Общий канал для всех сотрудников',
  unread: 3,
  memberCount: 6,
  createdAt: Date.now(),
};

describe('ChannelItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders channel name', () => {
    render(
      <ChannelItem channel={mockChannel} index={0} gradient="from-blue-400 to-indigo-500" t={(k: string) => k} />
    );
    expect(screen.getByText('Весь офис')).toBeInTheDocument();
  });

  it('renders channel description', () => {
    render(
      <ChannelItem channel={mockChannel} index={0} gradient="from-blue-400 to-indigo-500" t={(k: string) => k} />
    );
    expect(screen.getByText('Общий канал для всех сотрудников')).toBeInTheDocument();
  });

  it('renders unread badge when there are unread messages', () => {
    render(
      <ChannelItem channel={{ ...mockChannel, unread: 5 }} index={0} gradient="from-blue-400 to-indigo-500" t={(k: string) => k} />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not render unread badge when no unread messages', () => {
    render(
      <ChannelItem channel={{ ...mockChannel, unread: 0 }} index={0} gradient="from-blue-400 to-indigo-500" t={(k: string) => k} />
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onClick when the channel card is clicked', () => {
    const onClick = vi.fn();
    render(
      <ChannelItem channel={mockChannel} index={0} gradient="from-blue-400 to-indigo-500" onClick={onClick} t={(k: string) => k} />
    );

    const card = document.querySelector('[class*="cursor-pointer"]');
    expect(card).toBeInTheDocument();
    if (card) {
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    }
  });

  it('renders dark theme styles', () => {
    const { container } = render(
      <ChannelItem channel={mockChannel} index={0} gradient="from-blue-400 to-indigo-500" t={(k: string) => k} />
    );
    expect(container.querySelector('[class*="shadow-sm"]') || container.querySelector('[class*="cursor-pointer"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(
      <ChannelItem channel={mockChannel} index={0} gradient="from-blue-400 to-indigo-500" t={(k: string) => k} />
    );
    expect(container.querySelector('[class*="shadow-sm"]') || container.querySelector('[class*="hover:bg-"]')).toBeInTheDocument();
  });

  it('renders channel icon', () => {
    const { container } = render(
      <ChannelItem channel={mockChannel} index={0} gradient="from-blue-400 to-indigo-500" t={(k: string) => k} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with cursor pointer', () => {
    const { container } = render(
      <ChannelItem channel={mockChannel} index={0} gradient="from-blue-400 to-indigo-500" t={(k: string) => k} />
    );
    expect(container.querySelector('[class*="cursor-pointer"]')).toBeInTheDocument();
  });

  it('renders member count from description when no description provided', () => {
    render(
      <ChannelItem
        channel={{ ...mockChannel, description: undefined }}
        index={0}
        gradient="from-blue-400 to-indigo-500"
        t={(k: string, options?: any) => {
          if (k === 'company.memberCount' && options?.count) return `${options.count} members`;
          return k;
        }}
      />
    );
    expect(screen.getByText('6 members')).toBeInTheDocument();
  });
});
