// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContactCRMFields, ContactCustomField } from './ContactFormFields';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

describe('ContactFormFields', () => {
  it('CRM field boxes have 44px tap target (§2.2)', () => {
    render(
      <ContactCRMFields
        isDark
        company=""
        setCompany={() => {}}
        position=""
        setPosition={() => {}}
        tags={[]}
        setTags={() => {}}
        showTags={false}
        setShowTags={() => {}}
        t={t}
      />,
    );
    const companyBox = screen.getByPlaceholderText('Company').parentElement as HTMLElement;
    expect(companyBox.className).toContain('min-h-11');
    const positionBox = screen.getByPlaceholderText('Position (e.g. CEO, Manager)').parentElement as HTMLElement;
    expect(positionBox.className).toContain('min-h-11');
  });

  it('tag chips have 44px tap target (§2.2)', () => {
    const { container } = render(
      <ContactCRMFields
        isDark
        company=""
        setCompany={() => {}}
        position=""
        setPosition={() => {}}
        tags={[]}
        setTags={() => {}}
        showTags
        setShowTags={() => {}}
        t={t}
      />,
    );
    const grid = container.querySelector('.grid.grid-cols-2');
    expect(grid).toBeTruthy();
    const chips = grid!.querySelectorAll('button');
    expect(chips.length).toBeGreaterThan(0);
    chips.forEach((chip) => expect(chip.className).toContain('min-h-11'));
  });

  it('custom field controls have 44px tap target (§2.2)', () => {
    const field: any = { id: 'f1', type: 'phone', label: '', value: '', phoneSubtype: 'mobile' };
    render(<ContactCustomField isDark field={field} updateField={() => {}} removeField={() => {}} t={t} />);
    const selects = screen.getAllByRole('combobox');
    selects.forEach((select) => expect(select.className).toContain('min-h-11'));
    expect(screen.getByPlaceholderText('+7 999 123-45-67').className).toContain('min-h-11');
  });
});
