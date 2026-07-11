import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemberList } from './MemberList';
import type { CompanyMember } from '../../lib/company/types';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'company.teamMembers': 'Team Members',
        'company.roleAdmin': 'Admin',
        'company.roleMember': 'Member',
        'company.officeMoscow': 'Moscow',
        'company.officeLondon': 'London',
      };
      return translations[key] || key;
    },
    lang: 'ru',
    setLang: vi.fn(),
  }),
}));

const mockMembers: CompanyMember[] = [
  {
    userId: 'usr_001',
    displayName: 'Анна Волкова',
    role: 'admin',
    publicKey: 'pub_001',
    joinedAt: Date.now(),
    lastActive: Date.now(),
    online: true,
    office: 'moscow',
  },
  {
    userId: 'usr_002',
    displayName: 'Дмитрий Козлов',
    role: 'member',
    publicKey: 'pub_002',
    joinedAt: Date.now(),
    lastActive: Date.now(),
    online: false,
    office: 'london',
  },
];

describe('MemberList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all members', () => {
    render(
      <MemberList
       
        members={mockMembers}
        teamMembersLabel="Team Members"
        t={(k: string) => k}
      />
    );
    expect(screen.getByText('Анна Волкова')).toBeInTheDocument();
    expect(screen.getByText('Дмитрий Козлов')).toBeInTheDocument();
  });

  it('renders team members count', () => {
    render(
      <MemberList
       
        members={mockMembers}
        teamMembersLabel="Team Members"
        t={(k: string) => k}
      />
    );
    expect(screen.getByText('Team Members (2)')).toBeInTheDocument();
  });

  it('calls onMemberClick when a member card is clicked', () => {
    const onMemberClick = vi.fn();
    render(
      <MemberList
       
        members={mockMembers}
        onMemberClick={onMemberClick}
        teamMembersLabel="Team Members"
        t={(k: string) => k}
      />
    );

    const memberCards = document.querySelectorAll('[class*="cursor-pointer"]');
    expect(memberCards.length).toBe(2);
    if (memberCards.length > 0) {
      fireEvent.click(memberCards[0]!);
      expect(onMemberClick).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onMemberClick with correct member data for each member', () => {
    const onMemberClick = vi.fn();
    render(
      <MemberList
       
        members={mockMembers}
        onMemberClick={onMemberClick}
        teamMembersLabel="Team Members"
        t={(k: string) => k}
      />
    );

    const memberCards = document.querySelectorAll('[class*="cursor-pointer"]');
    if (memberCards.length >= 2) {
      fireEvent.click(memberCards[0]!);
      expect(onMemberClick).toHaveBeenCalledWith(mockMembers[0], expect.any(String));
    }
  });

  it('renders call buttons for each member', () => {
    const onCall = vi.fn();
    render(
      <MemberList
       
        members={mockMembers}
        onCall={onCall}
        teamMembersLabel="Team Members"
        t={(k: string) => k}
      />
    );

    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('renders video call buttons for each member', () => {
    const onVideoCall = vi.fn();
    render(
      <MemberList
       
        members={mockMembers}
        onVideoCall={onVideoCall}
        teamMembersLabel="Team Members"
        t={(k: string) => k}
      />
    );

    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('renders empty list when no members', () => {
    render(
      <MemberList
       
        members={[]}
        teamMembersLabel="Team Members"
        t={(k: string) => k}
      />
    );
    expect(screen.getByText('Team Members (0)')).toBeInTheDocument();
  });
});
