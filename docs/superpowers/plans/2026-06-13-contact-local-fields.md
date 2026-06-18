# Contact Local Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Add local-only custom fields (phone, Telegram, WhatsApp, Signal, email, custom) to contacts, persisted via Zustand, excluded from sharing.

**Architecture:** Create shared Contact type in `src/types/contact.ts`, wire existing Zustand store for persistence, add UI in ContactCreateEditModal and ContactProfileModal.

**Tech Stack:** React, Zustand, TypeScript, encryptedIdbStorage

---

### Task 1: Create shared Contact type

**Files:**
- Create: `src/types/contact.ts`
- Modify: `src/store/index.ts` (update Contact type import)

- [ ] **Step 1: Create src/types/contact.ts**

```typescript
export type FieldType = 'phone' | 'email' | 'telegram' | 'whatsapp' | 'signal' | 'custom';
export type PhoneSubtype = 'mobile' | 'work' | 'home' | 'main';

export interface ContactField {
  id: string;
  type: FieldType;
  label: string;
  value: string;
  phoneSubtype?: PhoneSubtype;
}

export interface Contact {
  name: string;
  id: string;
  color: string;
  lastSeen: number;
  isFavorite?: boolean;
  localFields?: ContactField[];
}
```

- [ ] **Step 2: Update Zustand store to use shared Contact type**

In `src/store/index.ts`, replace inline contact type with import, add `localFields` to the store interface:

```typescript
import type { Contact } from '@/src/types/contact';

// In AppState interface:
contacts: Contact[];
setContacts: (contacts: Contact[]) => void;
```

---

### Task 2: Wire Zustand store contacts to UI (replace useState)

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ContactsView.tsx`
- Modify: `src/components/Dialpad.tsx`

- [ ] **Step 1: In App.tsx** — remove `useState<contacts>`, read/write from store instead. Pass contacts from store to children.

- [ ] **Step 2: In ContactsView.tsx** — use store's `setContacts` through App.tsx props, update Contact type usage

- [ ] **Step 3: In Dialpad.tsx** — update Contact type usage

---

### Task 3: Add local fields UI to ContactCreateEditModal

**Files:**
- Modify: `src/components/ContactsView.tsx` (ContactCreateEditModal inside)

- [ ] **Step 1: Add local fields editing section** with type dropdown, value input, label input (for custom), phone subtype (for phone), delete button, add button

- [ ] **Step 2: Initialize localFields when creating/editing contact, save with contact**

---

### Task 4: Display local fields in ContactProfileModal

**Files:**
- Modify: `src/components/ContactProfileModal.tsx`

- [ ] **Step 1: Add "Local Info" section** showing type icons and values, with "not shared" note

---

### Task 5: Add localization strings

**Files:**
- Modify: All locale files in `src/locales/*.json`

- [ ] **Step 1: Add strings** for field labels, section title, hints

---

### Task 6: Tests

- [ ] **Step 1: Run existing tests** to verify nothing broken
