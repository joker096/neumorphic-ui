import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mockT = vi.fn((key: string, arg?: any) => {
  const map: Record<string, string> = {
    'company.departments': 'Departments',
    'company.departmentsEmpty': 'No departments yet',
    'company.contacts': 'Contacts',
    'company.contactsEmpty': 'No contacts yet',
    'company.departmentMemberCount': '{count} member(s)',
    'company.addDepartment': 'Add department',
    'company.addContact': 'Add contact',
  };
  if (typeof arg === 'object' && arg && '{count}' in arg) return map[key]?.replace('{count}', String(arg['{count}']));
  return map[key] || key;
});

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: mockT, lang: 'en', setLang: vi.fn() }),
}));

vi.mock('motion/react', () => ({
  motion: { button: ({ children, ...props }: any) => <button {...props}>{children}</button> },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

import { DepartmentList } from './DepartmentList';
import { ContactList } from './ContactList';
import type { CompanyDepartment, CompanyContact, CompanyMember } from '../../types/constants';

const members: CompanyMember[] = [
  { userId: 'u1', displayName: 'Alice', role: 'admin', publicKey: '', joinedAt: 0, lastActive: 0, online: true },
  { userId: 'u2', displayName: 'Bob', role: 'member', publicKey: '', joinedAt: 0, lastActive: 0, online: false },
];

describe('DepartmentList', () => {
  it('shows empty state when no departments', () => {
    render(
      <DepartmentList
        departments={[]}
        members={members}
        departmentsLabel="Departments"
        addLabel="Add department"
        t={mockT as any}
      />,
    );
    expect(screen.getByText('No departments yet')).toBeInTheDocument();
  });

  it('renders department with member count and fires click', () => {
    const onClick = vi.fn();
    const depts: CompanyDepartment[] = [
      { id: 'd1', name: 'Eng', description: 'Build', color: 'from-indigo-400 to-purple-500', memberIds: ['u1', 'u2'], createdAt: 0 },
    ];
    render(
      <DepartmentList
        departments={depts}
        members={members}
        departmentsLabel="Departments"
        addLabel="Add department"
        t={mockT as any}
        onDepartmentClick={onClick}
      />,
    );
    expect(screen.getByText('Eng')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Eng'));
    expect(onClick).toHaveBeenCalledWith(depts[0]);
  });
});

describe('ContactList', () => {
  it('shows empty state when no contacts', () => {
    render(
      <ContactList
        contacts={[]}
        departments={[]}
        contactsLabel="Contacts"
        addLabel="Add contact"
        t={mockT as any}
      />,
    );
    expect(screen.getByText('No contacts yet')).toBeInTheDocument();
  });

  it('renders contact and fires click', () => {
    const onClick = vi.fn();
    const contacts: CompanyContact[] = [
      { id: 'c1', name: 'John', title: 'CEO', phone: '+1', email: 'j@x.com', departmentId: null, createdAt: 0 },
    ];
    render(
      <ContactList
        contacts={contacts}
        departments={[]}
        contactsLabel="Contacts"
        addLabel="Add contact"
        t={mockT as any}
        onContactClick={onClick}
      />,
    );
    expect(screen.getByText('John')).toBeInTheDocument();
    fireEvent.click(screen.getByText('John'));
    expect(onClick).toHaveBeenCalledWith(contacts[0]);
  });
});
