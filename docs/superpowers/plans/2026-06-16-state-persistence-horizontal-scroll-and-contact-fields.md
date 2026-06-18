# State Persistence, Horizontal Scroll & Contact Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix state loss on navigation, add horizontal wheel scroll, add contact local fields

**Architecture:** Add Zustand store fields for persistent state (sound + radial hub toggles), add onWheel handlers to horizontal scrollers, extend ContactCreateEditModal and ContactProfileModal with localFields

**Tech Stack:** React 19, TypeScript, Zustand (persist via encrypted idb), Tailwind CSS, motion/react

---

### Task 1: Add Zustand Store Fields

**Files:**
- Modify: `src/store/index.ts`

- [ ] **Step 1: Add sound + radial state fields to AppState interface**

Add inside the `interface AppState {` block, after `currentLanguage: string;`:
```typescript
  // Sound
  soundEnabled: boolean;
  soundVolume: number;

  // Radial Hub states (persist across navigation)
  radialDnd: boolean;
  radialProxy: boolean;
  radialEnergy: boolean;
```

- [ ] **Step 2: Add setters to AppState interface**

Add after the existing setters:
```typescript
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setRadialDnd: (dnd: boolean) => void;
  setRadialProxy: (proxy: boolean) => void;
  setRadialEnergy: (energy: boolean) => void;
```

- [ ] **Step 3: Add initial values in the persist callback**

Inside `persist((set) => ({...}))`, after `currentLanguage: 'en',`:
```typescript
      soundEnabled: true,
      soundVolume: 0.7,
      radialDnd: false,
      radialProxy: true,
      radialEnergy: false,
```

- [ ] **Step 4: Add setter implementations**

After `updateSettings: (settings) => set((state) => ({ ...state, ...settings })),`:
```typescript
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSoundVolume: (volume) => set({ soundVolume: volume }),
      setRadialDnd: (dnd) => set({ radialDnd: dnd }),
      setRadialProxy: (proxy) => set({ radialProxy: proxy }),
      setRadialEnergy: (energy) => set({ radialEnergy: energy }),
```

- [ ] **Step 5: Git commit**

```bash
git add src/store/index.ts
git commit -m "feat: add sound and radial hub states to zustand store"
```

---

### Task 2: Wire RadialMenu to Store

**Files:**
- Modify: `src/App.tsx` (lines ~1057-1478)

- [ ] **Step 1: Replace local useState in RadialMenu with store reads**

Replace these lines in the `RadialMenu` component:
```typescript
  const [volume, setVolume] = useState(65);
  const [dnd, setDnd] = useState(false);
  const [proxy, setProxy] = useState(true);
  const [energy, setEnergy] = useState(false);
```
With:
```typescript
  const { t } = useI18n();
  const store = useAppStore();
  const volume = Math.round(store.soundVolume * 100);
  const dnd = store.radialDnd;
  const proxy = store.radialProxy;
  const energy = store.radialEnergy;
```

Add the import at the top of the RadialMenu function body (after the existing `const { t } = useI18n();` which is already there, just add the store line after it).

- [ ] **Step 2: Replace setVolume calls with store.setSoundVolume**

Replace `setVolume(0);` → `store.setSoundVolume(0);`  
Replace `setVolume(100);` → `store.setSoundVolume(1);`  
Replace `setVolume(Math.min(100, Math.max(0, Math.round(newVol))));` → `store.setSoundVolume(Math.min(1, Math.max(0, Math.round(newVol) / 100)));`

- [ ] **Step 3: Replace dnd toggle**

Replace `setDnd(!dnd)` → `store.setRadialDnd(!dnd)`

- [ ] **Step 4: Replace proxy toggle**

Replace `setProxy(!proxy)` → `store.setRadialProxy(!proxy)`

- [ ] **Step 5: Replace energy toggle**

Replace `setEnergy(!energy)` → `store.setRadialEnergy(!energy)`

- [ ] **Step 6: Git commit**

```bash
git add src/App.tsx
git commit -m "feat: wire radial menu hub states to zustand store"
```

---

### Task 3: Wire SoundContext to Store

**Files:**
- Modify: `src/components/SoundContext.tsx`

- [ ] **Step 1: Replace useState with store reads**

Replace:
```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
...
export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
```
With:
```typescript
import React, { createContext, useContext, useCallback } from 'react';
import { useAppStore } from '../store';
...
export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const enabled = useAppStore(state => state.soundEnabled);
  const volume = useAppStore(state => state.soundVolume);
  const setEnabled = useAppStore(state => state.setSoundEnabled);
  const setVolume = useAppStore(state => state.setSoundVolume);
```

- [ ] **Step 2: Git commit**

```bash
git add src/components/SoundContext.tsx
git commit -m "feat: wire sound context to zustand store"
```

---

### Task 4: Wire SettingsView Sound Toggle to Store

**Files:**
- Modify: `src/components/SettingsView.tsx`

- [ ] **Step 1: Remove `soundEnabled` useLocalStorage, use store instead**

In SettingsView, find:
```typescript
  const [soundEnabled, setSoundEnabled] = useLocalStorage("app_sound", true);
```
Remove this line. The soundEnabled is already pulled from store via `useAppStore()` if needed. But actually, looking at the SettingsView code, the `soundEnabled` variable is used in the SettingsItem for sound toggle at line ~831-836. Let me check what exactly is there.

Actually, looking at SettingsView.tsx more carefully: the `soundEnabled` from useLocalStorage is used in the notifications section as a toggle:
```tsx
<SettingsItem 
  isDark={isDark}
  title={sound}
  rightElement={<ToggleSwitch isOn={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} isDark={isDark} />}
  onClick={() => setSoundEnabled(!soundEnabled)}
/>
```

Replace `soundEnabled` and `setSoundEnabled` from useLocalStorage with store equivalents. Import `useAppStore` is already imported. Use:
```typescript
const storeSoundEnabled = useAppStore(state => state.soundEnabled);
const setStoreSoundEnabled = useAppStore(state => state.setSoundEnabled);
```

Replace the toggle to use `storeSoundEnabled` and `setStoreSoundEnabled`.

- [ ] **Step 2: Git commit**

```bash
git add src/components/SettingsView.tsx
git commit -m "feat: wire settings sound toggle to zustand store"
```

---

### Task 5: Add onWheel Horizontal Scroll to All Containers

**Files:**
- Modify: `src/App.tsx` (lines 735, 1700, 2162, 2225, 3783)
- Modify: `src/components/ContactsView.tsx` (line 146)
- Modify: `src/components/RecordingsScreen.tsx` (line 260)
- Modify: `src/components/ui/AvatarRow.tsx` (line 31)

- [ ] **Step 1: Add onWheel to App.tsx:735 (Dialpad call filter tabs)**

Find:
```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0">
```
Replace with:
```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
```

- [ ] **Step 2: Add onWheel to App.tsx:1700 (Stories AvatarRow)**

Find:
```tsx
<div className="flex items-center gap-4 px-3 overflow-x-auto pb-2 scrollbar-none shrink-0">
```
Replace with:
```tsx
<div className="flex items-center gap-4 px-3 overflow-x-auto pb-2 scrollbar-none shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
```

- [ ] **Step 3: Add onWheel to App.tsx:2162 (Chat media tabs bar)**

Find:
```tsx
<div className={`px-5 pt-4 pb-2 flex flex-col gap-2 overflow-x-auto scrollbar-none ${isDark ? "bg-[#1a1d24]/60" : "bg-[#f4f7f9]/60"}`}>
```
Replace with:
```tsx
<div className={`px-5 pt-4 pb-2 flex flex-col gap-2 overflow-x-auto scrollbar-none ${isDark ? "bg-[#1a1d24]/60" : "bg-[#f4f7f9]/60"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
```

- [ ] **Step 4: Add onWheel to App.tsx:2225 (Chat media items)**

Find:
```tsx
<div className="px-5 pb-3 overflow-x-auto scrollbar-none">
```
Replace with:
```tsx
<div className="px-5 pb-3 overflow-x-auto scrollbar-none" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
```

- [ ] **Step 5: Add onWheel to App.tsx:3783 (Top tab bar)**

Find:
```tsx
<div className={`flex items-center gap-5 mb-6 px-1 border-b pb-3 overflow-x-auto scrollbar-none shrink-0 ${isDark ? "border-white/5" : "border-black/5"}`}>
```
Replace with:
```tsx
<div className={`flex items-center gap-5 mb-6 px-1 border-b pb-3 overflow-x-auto scrollbar-none shrink-0 ${isDark ? "border-white/5" : "border-black/5"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
```

- [ ] **Step 6: Add onWheel to ContactsView.tsx:146**

Find:
```tsx
<div className={`flex rounded-full p-1 overflow-x-auto scrollbar-none ${isDark ? "bg-white/5" : "bg-black/5"}`}>
```
Replace with:
```tsx
<div className={`flex rounded-full p-1 overflow-x-auto scrollbar-none ${isDark ? "bg-white/5" : "bg-black/5"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
```

- [ ] **Step 7: Add onWheel to RecordingsScreen.tsx:260**

Find:
```tsx
<div className="flex items-center gap-2 px-4 mb-3 overflow-x-auto">
```
Replace with:
```tsx
<div className="flex items-center gap-2 px-4 mb-3 overflow-x-auto" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
```

- [ ] **Step 8: Add onWheel to AvatarRow.tsx:31**

Find:
```tsx
<div className="flex items-center gap-4 px-3 overflow-x-auto pb-2 scrollbar-none shrink-0">
```
Replace with:
```tsx
<div className="flex items-center gap-4 px-3 overflow-x-auto pb-2 scrollbar-none shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
```

- [ ] **Step 9: Git commit**

```bash
git add src/App.tsx src/components/ContactsView.tsx src/components/RecordingsScreen.tsx src/components/ui/AvatarRow.tsx
git commit -m "feat: add horizontal wheel scroll to all overflow-x-auto containers"
```

---

### Task 6: Move Contacts to Zustand Store

**Files:**
- Modify: `src/store/index.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/ContactsView.tsx`
- Modify: `src/types/contact.ts`

- [ ] **Step 1: Add contacts to AppState interface**

Add to the interface in `src/store/index.ts`:
```typescript
  contacts: Contact[];
  setContacts: (updater: Contact[] | ((prev: Contact[]) => Contact[])) => void;
```

Import Contact:
```typescript
import type { Contact } from '../types/contact';
```

- [ ] **Step 2: Add initial value and setter in persist callback**

Add after `chats: [],`:
```typescript
      contacts: [],
      setContacts: (updater) => set((state) => ({
        contacts: typeof updater === 'function' ? updater(state.contacts) : updater
      })),
```

- [ ] **Step 3: Update App.tsx to use store contacts**

Remove:
```typescript
const [contacts, setContacts] = useState<Array<{ name: string; id: string; color: string; lastSeen: number }>>([
    { name: "Alice", id: "5a2f...9b1c", color: "from-rose-400 to-red-500", lastSeen: 1000 * 60 * 5 },
    { name: "Bob (Relay)", id: "node_f88b", color: "from-blue-400 to-indigo-500", lastSeen: 1000 * 60 * 60 * 2 },
    { name: "Charlie", id: "3c4d...5e6f", color: "from-amber-400 to-orange-400", lastSeen: 1000 * 60 * 30 },
    { name: "Diana", id: "7g8h...9i0j", color: "from-purple-400 to-fuchsia-400", lastSeen: 1000 * 60 * 60 * 24 },
  ]);
```

Add in App function body:
```typescript
  const contacts = useAppStore(state => state.contacts);
  const setContacts = useAppStore(state => state.setContacts);
```

Also add initial contacts if empty (in the useEffect that initializes mock data):
```typescript
  useEffect(() => {
    if (contacts.length === 0) {
      setContacts([
        { name: "Alice", id: "5a2f...9b1c", color: "from-rose-400 to-red-500", lastSeen: 1000 * 60 * 5 },
        { name: "Bob (Relay)", id: "node_f88b", color: "from-blue-400 to-indigo-500", lastSeen: 1000 * 60 * 60 * 2 },
        { name: "Charlie", id: "3c4d...5e6f", color: "from-amber-400 to-orange-400", lastSeen: 1000 * 60 * 30 },
        { name: "Diana", id: "7g8h...9i0j", color: "from-purple-400 to-fuchsia-400", lastSeen: 1000 * 60 * 60 * 24 },
      ]);
    }
  }, []);
```

Remove the `contacts` prop from `<ContactsView>` and `<Dialpad>` usages and use store directly in those components, or pass from store.

Actually, simplest approach: App.tsx already passes contacts as props. Just read from store at App level and pass down. The key change is that contacts are now in the store instead of useState.

- [ ] **Step 4: Update ContactsView to use Contact type from types**

In `ContactsView.tsx`, change the local `Contact` type to use the import from `../types/contact`:
```typescript
import type { Contact } from '../types/contact';
```
Remove the local `export type Contact = ...` definition.

- [ ] **Step 5: Git commit**

```bash
git add src/store/index.ts src/App.tsx src/components/ContactsView.tsx
git commit -m "feat: move contacts to zustand store"
```

---

### Task 7: Add Local Fields to ContactCreateEditModal

**Files:**
- Modify: `src/components/ContactCreateEditModal.tsx`

- [ ] **Step 1: Add local fields state and UI**

Add imports:
```typescript
import type { ContactField, FieldType, PhoneSubtype } from '../types/contact';
import { Plus, Phone, Mail, Send, Type, Trash2 } from 'lucide-react';
```

Add state inside the component after existing state:
```typescript
  const [localFields, setLocalFields] = useState<ContactField[]>(contact?.localFields || []);
```

Add field management functions:
```typescript
  const addField = () => {
    const newField: ContactField = {
      id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'custom',
      label: '',
      value: '',
    };
    setLocalFields([...localFields, newField]);
  };

  const updateField = (id: string, updates: Partial<ContactField>) => {
    setLocalFields(localFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setLocalFields(localFields.filter(f => f.id !== id));
  };
```

Update the handleSubmit to include localFields:
```typescript
    onSave(name.trim(), id.trim(), contact?.color, localFields);
```

- [ ] **Step 2: Update the onSave type and parent calls**

Change `onSave` prop type from `(name: string, id: string, color?: string) => void` to:
```typescript
  onSave: (name: string, id: string, color?: string, localFields?: ContactField[]) => void;
```

Add the local fields UI section inside the form, after the id input and before the submit button:
```tsx
          <div className="flex flex-col gap-3 mt-2">
            <div className={`flex items-center justify-between ${isDark ? "text-gray-300" : "text-slate-700"}`}>
              <span className="text-xs font-bold uppercase tracking-widest">Local Info</span>
              <button
                type="button"
                onClick={addField}
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-600 hover:bg-orange-200"}`}
              >
                + Add Field
              </button>
            </div>
            {localFields.map((field) => (
              <div key={field.id} className={`p-3 rounded-2xl flex flex-col gap-2 ${isDark ? "bg-[#13151b] border border-white/5" : "bg-slate-50 border border-black/5"}`}>
                <div className="flex items-center gap-2">
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const newType = e.target.value as FieldType;
                      const defaults: Record<FieldType, string> = { phone: 'Phone', email: 'Email', telegram: 'Telegram', whatsapp: 'WhatsApp', signal: 'Signal', custom: field.label || '' };
                      updateField(field.id, { type: newType, label: defaults[newType] || '' });
                    }}
                    className={`flex-1 h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white text-slate-800 border border-black/10"}`}
                  >
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="telegram">Telegram</option>
                    <option value="custom">Custom</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-500 hover:bg-red-100"}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {field.type === 'phone' && (
                  <select
                    value={field.phoneSubtype || 'mobile'}
                    onChange={(e) => updateField(field.id, { phoneSubtype: e.target.value as PhoneSubtype })}
                    className={`h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white text-slate-800 border border-black/10"}`}
                  >
                    <option value="mobile">Mobile</option>
                    <option value="work">Work</option>
                    <option value="home">Home</option>
                    <option value="main">Main</option>
                  </select>
                )}
                {field.type === 'custom' && (
                  <input
                    type="text"
                    placeholder="Label"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className={`w-full h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white text-slate-800 border border-black/10"}`}
                  />
                )}
                <input
                  type="text"
                  placeholder={field.type === 'phone' ? '+7 999 123-45-67' : field.type === 'email' ? 'user@example.com' : field.type === 'telegram' ? '@username' : 'Value'}
                  value={field.value}
                  onChange={(e) => updateField(field.id, { value: e.target.value })}
                  className={`w-full h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white text-slate-800 border border-black/10"}`}
                />
              </div>
            ))}
            {localFields.length === 0 && (
              <div className={`text-[10px] text-center py-2 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                No local fields. Add phone, email, Telegram, or custom data.
              </div>
            )}
            <div className={`text-[9px] text-center ${isDark ? "text-gray-600" : "text-slate-400"}`}>
              Local fields are stored securely and never shared with anyone.
            </div>
          </div>
```

- [ ] **Step 3: Update parent onSave calls in App.tsx**

Find all places where `onSave` is called and update to accept localFields:
```typescript
onSave={(name, id, color, localFields) => {
  setContacts(contacts.map(c =>
    c.id === editingContact.id ? { ...c, name, id, color: color || c.color, localFields: localFields || c.localFields } : c
  ));
  setEditingContact(null);
}}
```

And in ContactsView.tsx, update handleSaveContact:
```typescript
const handleSaveContact = (name: string, id: string, color?: string, localFields?: ContactField[]) => {
  if (editingContact) {
    setContacts(contacts.map(c => c.id === editingContact.id ? { ...c, name, id, color: color || c.color, localFields } : c));
  } else {
    const colors = ["from-teal-400 to-emerald-500", "from-pink-400 to-rose-500", "from-yellow-400 to-orange-500"];
    const newColor = colors[contacts.length % colors.length];
    setContacts([{ name, id, color: newColor, lastSeen: Date.now(), localFields }, ...contacts]);
  }
  setShowAddForm(false);
  setShowEditForm(false);
  setEditingContact(null);
};
```

- [ ] **Step 4: Git commit**

```bash
git add src/components/ContactCreateEditModal.tsx src/App.tsx src/components/ContactsView.tsx
git commit -m "feat: add local fields to contact create/edit modal"
```

---

### Task 8: Display Local Fields in ContactProfileModal

**Files:**
- Modify: `src/components/ContactProfileModal.tsx`
- Modify: `src/types/contact.ts`

- [ ] **Step 1: Extend ContactProfile type to include localFields**

In `ContactProfileModal.tsx`, update the `ContactProfile` type:
```typescript
export type ContactProfile = {
  id: string;
  name: string;
  color?: string;
  lastSeen?: number;
  online?: boolean;
  localFields?: import('../types/contact').ContactField[];
  callInfo?: {
    time: string;
    type: 'missed' | 'incoming' | 'outgoing' | 'returned';
    duration?: string;
  };
};
```

- [ ] **Step 2: Add local fields display UI**

Add after the lastSeen/online section (after line ~125) and before the action buttons:
```tsx
            {contact.localFields && contact.localFields.length > 0 && (
              <div className={`w-full mt-4 p-4 rounded-2xl flex flex-col gap-2 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  Local Info
                </div>
                {contact.localFields.map(field => (
                  <div key={field.id} className="flex items-center gap-2">
                    {field.type === 'phone' && <Phone size={12} className={isDark ? "text-gray-400" : "text-slate-500"} />}
                    {field.type === 'email' && <Mail size={12} className={isDark ? "text-gray-400" : "text-slate-500"} />}
                    {field.type === 'telegram' && <Send size={12} className={isDark ? "text-gray-400" : "text-slate-500"} />}
                    <span className={`text-xs ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                      {field.label || field.type}: {field.value}
                    </span>
                  </div>
                ))}
                <div className={`text-[9px] mt-1 ${isDark ? "text-gray-600" : "text-slate-400"}`}>
                  Not shared when sharing contact
                </div>
              </div>
            )}
```

- [ ] **Step 3: Wire contact data with localFields in App.tsx**

Update all places where setSelectedContact or setGlobalSelectedContact is called to include localFields from the contacts array.

Update the globalSelectedContact set calls in App.tsx:
```typescript
setGlobalSelectedContact({
  id: `hash_${c.id}`,
  name: c.name,
  color: c.color,
  localFields: (c as any).localFields || [],
  lastSeen: c.online ? 0 : Date.now() - 3600000,
  online: c.online
})
```

And similarly for Dialpad's selectedContact and ChatPreviewLayer's selectedContact.

- [ ] **Step 4: Git commit**

```bash
git add src/components/ContactProfileModal.tsx src/App.tsx
git commit -m "feat: display local fields in contact profile modal"
```

---

### Task 9: Add Localization Strings

**Files:**
- Modify: `src/locales/en.json` (or similar)
- Modify: `src/locales/ru.json` (or similar)

- [ ] **Step 1: Find locale files**

```bash
ls src/locales/
```

- [ ] **Step 2: Add translation keys**

Add to each locale file:
```json
{
  "contacts": {
    "localInfo": "Local Info",
    "localFieldsNotShared": "Not shared when sharing contact",
    "addField": "Add Field",
    "noLocalFields": "No local fields",
    "fieldTypePhone": "Phone",
    "fieldTypeEmail": "Email",
    "fieldTypeTelegram": "Telegram",
    "fieldTypeCustom": "Custom",
    "fieldSubtypeMobile": "Mobile",
    "fieldSubtypeWork": "Work",
    "fieldSubtypeHome": "Home",
    "fieldSubtypeMain": "Main"
  }
}
```

- [ ] **Step 3: Git commit**

```bash
git add src/locales/
git commit -m "feat: add localization strings for contact local fields"
```

---

### Task 10: Verify Build

- [ ] **Step 1: Run type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Run linter**

```bash
npm run lint
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

- [ ] **Step 4: Fix any issues**

- [ ] **Step 5: Commit fixes**

```bash
git add -A
git commit -m "fix: type and lint issues from state persistence and contact fields"
```
