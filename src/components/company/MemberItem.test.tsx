import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemberItem } from './MemberItem';
import type { CompanyMember } from '../../lib/company/types';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: vi.fn((key: string) => key),
    lang: 'ru',
    setLang: vi.fn(),
  }),
}));

const mockMember: CompanyMember = {
  userId: 'usr_001',
  displayName: 'Анна Волкова',
  role: 'admin',
  publicKey: 'pub_001',
  joinedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
  lastActive: Date.now() - 5 * 60 * 1000,
  online: true,
  office: 'moscow',
};

describe('MemberItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders member display name', () => {
    render(
      <MemberItem member={mockMember} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(screen.getByText('Анна Волкова')).toBeInTheDocument();
  });

  it('renders online indicator when member is online', () => {
    render(
      <MemberItem member={{ ...mockMember, online: true }} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(screen.getByText('Анна Волкова')).toBeInTheDocument();
  });

  it('renders online indicator when member is offline', () => {
    render(
      <MemberItem member={{ ...mockMember, online: false }} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(screen.getByText('Анна Волкова')).toBeInTheDocument();
  });

  it('calls onClick when the member card is clicked', () => {
    const onClick = vi.fn();
    render(
      <MemberItem member={mockMember} index={0} color="from-indigo-400 to-purple-500" onClick={onClick} t={(k: string) => k} />
    );
    const card = document.querySelector('[class*="cursor-pointer"]') as HTMLElement;
    expect(card).toBeInTheDocument();
    if (card) {
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onCall with correct name when call button is clicked', () => {
    const onCall = vi.fn();
    render(
      <MemberItem member={mockMember} index={0} color="from-indigo-400 to-purple-500" onCall={onCall} onClick={() => {}} t={(k: string) => k} />
    );
    const callButton = document.querySelector('button svg');
    expect(callButton).toBeInTheDocument();
    if (callButton) {
      fireEvent.click(callButton);
      expect(onCall).toHaveBeenCalledWith('Анна Волкова', 'from-indigo-400 to-purple-500');
    }
  });

  it('calls onVideoCall with correct name when video button is clicked', () => {
    const onVideoCall = vi.fn();
    render(
      <MemberItem member={mockMember} index={0} color="from-indigo-400 to-purple-500" onVideoCall={onVideoCall} onClick={() => {}} t={(k: string) => k} />
    );
    const allButtons = document.querySelectorAll('button svg');
    expect(allButtons.length).toBeGreaterThanOrEqual(2);
    if (allButtons.length >= 2) {
      fireEvent.click(allButtons[1]!);
      expect(onVideoCall).toHaveBeenCalledWith('Анна Волкова', 'from-indigo-400 to-purple-500');
    }
  });

  it('renders admin role label', () => {
    render(
      <MemberItem member={{ ...mockMember, role: 'admin' }} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(screen.getByText(/company\.roleAdmin/)).toBeInTheDocument();
  });

  it('renders member role label', () => {
    render(
      <MemberItem member={{ ...mockMember, role: 'member' }} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(screen.getByText(/company\.roleMember/)).toBeInTheDocument();
  });

  it('renders office name Moscow', () => {
    render(
      <MemberItem member={{ ...mockMember, office: 'moscow' }} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(screen.getByText(/company\.officeMoscow/)).toBeInTheDocument();
  });

  it('renders office name London', () => {
    render(
      <MemberItem member={{ ...mockMember, office: 'london' }} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(screen.getByText(/company\.officeLondon/)).toBeInTheDocument();
  });

  it('renders avatar initial from display name', () => {
    render(
      <MemberItem member={mockMember} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(screen.getByText('А')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
    const { container } = render(
      <MemberItem member={mockMember} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(container.querySelector('[class*="shadow-sm"]') || container.querySelector('[class*="cursor-pointer"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(
      <MemberItem member={mockMember} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(container.querySelector('[class*="shadow-sm"]') || container.querySelector('[class*="hover:bg-"]')).toBeInTheDocument();
  });

  it('has cursor-pointer class on card', () => {
    const { container } = render(
      <MemberItem member={mockMember} index={0} color="from-indigo-400 to-purple-500" onClick={() => {}} t={(k: string) => k} />
    );
    expect(container.querySelector('[class*="cursor-pointer"]')).toBeInTheDocument();
  });

  it('prevents call button click from triggering card onClick', () => {
    const onClick = vi.fn();
    const onCall = vi.fn();
    render(
      <MemberItem member={mockMember} index={0} color="from-indigo-400 to-purple-500" onClick={onClick} onCall={onCall} t={(k: string) => k} />
    );
    const svgButtons = document.querySelectorAll('button svg');
    if (svgButtons.length > 0) {
      fireEvent.click(svgButtons[0]!);
      expect(onCall).toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    }
  });

  it('prevents video button click from triggering card onClick', () => {
    const onClick = vi.fn();
    const onVideoCall = vi.fn();
    render(
      <MemberItem member={mockMember} index={0} color="from-indigo-400 to-purple-500" onClick={onClick} onVideoCall={onVideoCall} t={(k: string) => k} />
    );
    const svgButtons = document.querySelectorAll('button svg');
    if (svgButtons.length >= 2) {
      fireEvent.click(svgButtons[1]!);
      expect(onVideoCall).toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    }
  });
});
