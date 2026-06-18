# Contact Local Fields Design

## Problem
Contacts currently have only `name`, `id`, `color`, `lastSeen`. Users want to store local metadata (phone, Telegram, WhatsApp, etc.) per contact that is NOT shared when sharing contacts.

## Data Model

```typescript
interface ContactField {
  id: string;
  type: 'phone' | 'email' | 'telegram' | 'whatsapp' | 'signal' | 'custom';
  label: string;
  value: string;
  phoneSubtype?: 'mobile' | 'work' | 'home' | 'main';
}

interface Contact {
  name: string;
  id: string;
  color: string;
  lastSeen: number;
  isFavorite?: boolean;
  localFields?: ContactField[];
}
```

## Storage
- Move contacts from `useState` in App.tsx to existing Zustand store (`contacts`/`setContacts`)
- Store already persists via `encryptedIdbStorage` — contacts become persistent
- `localFields` stored as part of contact, encrypted at rest

## UI

### Edit (ContactCreateEditModal)
- New "Local Info" section below existing fields
- Each field row: type dropdown (Phone/Email/Telegram/WhatsApp/Signal/Custom), value input, label input (for Custom), phone subtype dropdown (for Phone), delete button
- "+ Add Field" button
- Saved with contact on "Save"

### View (ContactProfileModal)
- "Local Info" section with type icons and values
- Note: "Local fields are not shared"

## Share Identity
- Unchanged — `localFields` excluded from any share/QR flow

## Implementation Order
1. Create `src/types/contact.ts` with shared types
2. Update Zustand store to use Contact type, wire to UI
3. Update App.tsx — remove `useState` contacts, use store
4. Add local fields UI to ContactCreateEditModal (inside ContactsView.tsx)
5. Display local fields in ContactProfileModal
6. Add localization strings to all locale files
7. Tests
