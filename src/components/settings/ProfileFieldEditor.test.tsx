import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ProfileFieldEditor } from './ProfileFieldEditor';
import type { ProfileField } from './ProfileSection';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const fields: ProfileField[] = [
  { id: 'f1', type: 'custom', visibility: 'everyone', label: 'Label', value: '' },
  { id: 'f2', type: 'phone', visibility: 'contactsOnly', label: 'Phone', value: '+7' },
];

const renderEditor = () =>
  render(
    <ProfileFieldEditor
      fields={fields}
      onAdd={vi.fn()}
      onRemove={vi.fn()}
      onUpdate={vi.fn()}
      newFieldVisibility="everyone"
      onVisibilityChange={vi.fn()}
      t={t}
    />,
  );

describe('ProfileFieldEditor', () => {
  it('visibility select and field controls have 44px tap target (§2.2)', () => {
    renderEditor();
    const selects = screen.getAllByRole('combobox');
    // top visibility select + per-field type/visibility selects (2 fields × 2)
    expect(selects).toHaveLength(5);
    for (const s of selects) expect(s.className).toContain('min-h-11');
  });

  it('custom label input and value inputs have 44px tap target (§2.2)', () => {
    renderEditor();
    const inputs = screen.getAllByRole('textbox');
    // custom-label input + 2 value inputs
    expect(inputs).toHaveLength(3);
    for (const i of inputs) expect(i.className).toContain('min-h-11');
  });
});
