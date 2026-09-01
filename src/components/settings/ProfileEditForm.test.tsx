import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Camera: 'div', X: 'div', Check: 'div',
}));
vi.mock('./ProfileFieldEditor', () => ({
  ProfileFieldEditor: (props: any) => (
    <div data-testid="field-editor">
      <button data-testid="fe-add" onClick={() => props.onAdd()}>add-field</button>
      <button data-testid="fe-remove" onClick={() => props.onRemove('f1')}>remove-field</button>
      <button data-testid="fe-update" onClick={() => props.onUpdate('f1', { value: 'x' })}>update-field</button>
      <select
        data-testid="fe-visibility"
        value={props.newFieldVisibility}
        onChange={(e) => props.onVisibilityChange(e.target.value)}
      >
        <option value="everyone">everyone</option>
        <option value="contactsOnly">contactsOnly</option>
      </select>
    </div>
  ),
}));

import { ProfileEditForm } from './ProfileEditForm';
import { AVATAR_COLORS } from '../../constants/settingsConstants';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const baseProps = () => ({
  isDark: false,
  t,
  editName: 'Alice',
  editUsername: 'alice',
  editBio: 'bio',
  editAvatar: '',
  editStatus: 'status',
  editColor: 'from-orange-400 to-red-500',
  editFields: [] as any[],
  newFieldVisibility: 'everyone' as const,
  setEditName: vi.fn(),
  setEditUsername: vi.fn(),
  setEditBio: vi.fn(),
  setEditAvatar: vi.fn(),
  setEditStatus: vi.fn(),
  setEditColor: vi.fn(),
  setNewFieldVisibility: vi.fn(),
  fileInputRef: { current: null } as any,
  onFileChange: vi.fn(),
  onAddField: vi.fn(),
  onRemoveField: vi.fn(),
  onUpdateField: vi.fn(),
  onCancel: vi.fn(),
  onSave: vi.fn(),
});

const renderForm = (overrides: Record<string, any> = {}) =>
  render(<ProfileEditForm {...baseProps()} {...overrides} />);

describe('ProfileEditForm', () => {
  it('renders labeled inputs pre-filled with values', () => {
    renderForm();
    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toHaveValue('Alice');
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('@username')).toHaveValue('alice');
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What's on your mind?")).toHaveValue('status');
    expect(screen.getByText('Bio')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tell others about yourself')).toHaveValue('bio');
    expect(screen.getByText('Tap to upload or change your photo')).toBeInTheDocument();
  });

  it('edits propagate through setters', () => {
    const p = baseProps();
    renderForm(p);
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), { target: { value: 'Bob' } });
    expect(p.setEditName).toHaveBeenCalledWith('Bob');
    fireEvent.change(screen.getByPlaceholderText('@username'), { target: { value: 'bob' } });
    expect(p.setEditUsername).toHaveBeenCalledWith('bob');
    fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), { target: { value: 'busy' } });
    expect(p.setEditStatus).toHaveBeenCalledWith('busy');
    fireEvent.change(screen.getByPlaceholderText('Tell others about yourself'), { target: { value: 'hello' } });
    expect(p.setEditBio).toHaveBeenCalledWith('hello');
  });

  it('sanitizes username input (allowed chars, 32 chars max)', () => {
    const p = baseProps();
    renderForm(p);
    fireEvent.change(screen.getByPlaceholderText('@username'), { target: { value: 'ab@c!d#' } });
    expect(p.setEditUsername).toHaveBeenCalledWith('abcd');
    fireEvent.change(screen.getByPlaceholderText('@username'), { target: { value: `${'a'.repeat(40)}!` } });
    expect(p.setEditUsername).toHaveBeenCalledWith('a'.repeat(32));
  });

  it('shows initial letter avatar and color picker when no avatar', () => {
    const { container } = renderForm();
    expect(screen.getByText('A')).toBeInTheDocument();
    const colorButtons = container.querySelectorAll('button.w-10');
    expect(colorButtons).toHaveLength(AVATAR_COLORS.length);
  });

  it('selects a different avatar color', () => {
    const p = baseProps();
    const { container } = renderForm(p);
    const colorButtons = container.querySelectorAll('button.w-10');
    fireEvent.click(colorButtons[2]);
    expect(p.setEditColor).toHaveBeenCalledWith(AVATAR_COLORS[2]);
  });

  it('hides color picker and shows image when avatar present', () => {
    const { container } = renderForm({ editAvatar: 'data:image/png;base64,xx' });
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'data:image/png;base64,xx');
    expect(container.querySelectorAll('button.w-10')).toHaveLength(0);
  });

  it('avatar click triggers hidden file input', () => {
    const { container } = renderForm();
    const input = container.querySelector('input[type="file"]')!;
    const spy = vi.fn();
    input.addEventListener('click', spy);
    fireEvent.click(container.querySelector('.cursor-pointer')!);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('file input change forwards to onFileChange', () => {
    const p = baseProps();
    const { container } = renderForm(p);
    const input = container.querySelector('input[type="file"]')!;
    expect(input).toHaveAttribute('accept', 'image/*');
    fireEvent.change(input, { target: { files: [new File([''], 'a.png')] } });
    expect(p.onFileChange).toHaveBeenCalled();
  });

  it('delegates field editor actions', () => {
    const p = baseProps();
    renderForm(p);
    expect(screen.getByTestId('field-editor')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('fe-add'));
    expect(p.onAddField).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('fe-remove'));
    expect(p.onRemoveField).toHaveBeenCalledWith('f1');
    fireEvent.click(screen.getByTestId('fe-update'));
    expect(p.onUpdateField).toHaveBeenCalledWith('f1', { value: 'x' });
    fireEvent.change(screen.getByTestId('fe-visibility'), { target: { value: 'contactsOnly' } });
    expect(p.setNewFieldVisibility).toHaveBeenCalledWith('contactsOnly');
  });

  it('submit triggers onSave', () => {
    const p = baseProps();
    renderForm(p);
    fireEvent.click(screen.getByText('Save Profile'));
    expect(p.onSave).toHaveBeenCalledTimes(1);
  });

  it('cancel triggers onCancel', () => {
    const p = baseProps();
    renderForm(p);
    fireEvent.click(screen.getByText('Cancel'));
    expect(p.onCancel).toHaveBeenCalledTimes(1);
  });
});