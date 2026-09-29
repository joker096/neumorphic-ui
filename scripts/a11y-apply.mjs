/**
 * a11y-apply.mjs — insert `aria-label` on every unlabelled form control found by
 * a11y-classify.mjs, so screen-reader users get a name for each one.
 *
 * Default run is a DRY RUN (prints the plan). Pass `--write` to apply.
 *
 * Labels come from three sources:
 *   1. the control's own (already localized) `placeholder` expression  — mechanical, no new i18n
 *   2. the adjacent visible <label> text                               — reuse the same key
 *   3. OVERRIDES below                                                — hand-picked keys
 *
 * Example-only placeholders ("0.00", "@username", "+7 999 123-45-67", …) are NOT valid
 * accessible names, so those sites are overridden with a real key.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from './a11y-classify.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

/** Hand-picked accessible names, keyed by `file:line`. Everything else reuses its placeholder. */
const OVERRIDES = {
  // placeholder is an example value, not a name
  'src/components/settings/PaymentRequestsSection.tsx:81': "{t('payRequests.amount', 'Amount')}",
  'src/components/settings/PaymentRequestsSection.tsx:90': "{t('payRequests.currency', 'Currency')}",
  'src/components/settings/PaymentsSection.tsx:154': "{t('payments.amount', 'Amount')}",
  'src/components/settings/PaymentsSection.tsx:161': "{t('payments.currency', 'Currency')}",
  'src/components/settings/ProfileAccounts.tsx:117': "{t('settings.accountUsername', 'Username')}",
  'src/components/contacts/ContactFormFields.tsx:177': "{t('contacts.fieldValue', 'Value')}",
  'src/components/settings/ProfileFieldEditor.tsx:83': "{t('settings.genericValuePlaceholder', 'Value')}",

  // visible sibling text / section title already names the control
  'src/components/chat-preview/ChatMediaPanel.tsx:79': "{t('chat.filters.from', 'From')}",
  'src/components/chat-preview/ChatMediaPanel.tsx:81': "{t('chat.filters.to', 'To')}",
  'src/components/crm/CrmFilterBar.tsx:46': "{t('crm.role', CRM_FALLBACKS.role)}",
  'src/components/crm/CrmFilterBar.tsx:52': "{t('crm.department', CRM_FALLBACKS.department)}",
  'src/components/crm/CrmFilterBar.tsx:58': "{t('crm.status', CRM_FALLBACKS.status)}",
  'src/components/crm/CrmFilterBar.tsx:64': "{t('crm.tag', CRM_FALLBACKS.tag)}",
  'src/components/crm/CrmRoles.tsx:65': "{t('crm.departmentName', 'Department name')}",
  'src/components/crm/CrmRoles.tsx:70': "{t('crm.departmentLead', CRM_FALLBACKS.departmentLead)}",
  'src/components/crm/CrmRoles.tsx:112': "{t('crm.roleName', CRM_FALLBACKS.roleName)}",
  'src/components/crm/CrmPeople.tsx:301': "{t('crm.bulkAssign', CRM_FALLBACKS.bulkAssign)}",

  // controls with no placeholder and no adjacent label text
  'src/components/chat-preview/ChatInputSchedulePopup.tsx:34': "{t('chat.scheduleSend', 'Schedule send')}",
  'src/components/company/SiteChatManager.tsx:141': "{t('company.embedSnippet', 'Embed snippet')}",
  'src/components/contacts/ContactFormFields.tsx:130': "{t('contacts.fieldTypeLabel', 'Type')}",
  'src/components/contacts/ContactFormFields.tsx:154': "{t('contacts.fieldSubtypeLabel', 'Subtype')}",
  'src/components/settings/ProfileFieldEditor.tsx:33': "{t('settings.fieldVisibility', 'Visibility')}",
  'src/components/settings/ProfileFieldEditor.tsx:46': "{t('settings.fieldTypeLabel', 'Type')}",
  'src/components/settings/ProfileFieldEditor.tsx:55': "{t('settings.fieldVisibility', 'Visibility')}",
};

const rows = classify();
const perFile = new Map();
let missing = 0;
for (const r of rows) {
  const key = `${r.file.replace(/\\/g, '/')}:${r.line}`;
  const raw = OVERRIDES[key] || r.label;
  if (raw === '-') { missing++; console.log(`!! no label for ${key} <${r.tag}>`); continue; }
  // JSX attribute values must be braced: aria-label={t('…')}
  const label = raw.startsWith('{') ? raw : `{${raw}}`;
  if (!perFile.has(r.file)) perFile.set(r.file, []);
  perFile.get(r.file).push({ ...r, label, key });
}

console.log(`\n=== A11Y APPLY PLAN (${WRITE ? 'WRITE' : 'DRY RUN'}) ===  sites: ${rows.length}, files: ${perFile.size}, unlabelled: ${missing}\n`);
let edits = 0;
for (const [file, list] of perFile) {
  const full = resolve(ROOT, file);
  let code = readFileSync(full, 'utf-8');
  console.log(`--- ${file}`);
  // apply back-to-front so earlier offsets stay valid
  for (const r of [...list].sort((a, b) => b.insertAt - a.insertAt)) {
    const ins = r.multiline
      ? `\n${r.indent}  aria-label=${r.label}`
      : ` aria-label=${r.label}`;
    code = code.slice(0, r.insertAt) + ins + code.slice(r.insertAt);
    edits++;
    console.log(`  L${r.line} <${r.tag}> -> aria-label=${r.label}`.slice(0, 160));
  }
  if (WRITE) writeFileSync(full, code);
}
console.log(`\n${edits} aria-labels ${WRITE ? 'written' : 'planned'}.`);
