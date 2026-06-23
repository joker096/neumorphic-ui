# Settings Localization, PWA Banner, and Contact Call Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize the settings PWA install banner, increase its card height so text is not clipped, and replace the contact profile call button with a segmented audio/video call control.

**Architecture:** Keep the existing component boundaries: `SettingsView` owns the PWA banner, `ContactProfileModal` owns the segmented call UI, and parent screens pass optional video-call handlers through the existing `onCall` flow. Locale strings live in each `src/locales/*.json` file.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, `lucide-react`, `motion/react`, Vitest, React Testing Library.

---

### Task 1: Add PWA banner localization strings

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/ru.json`
- Modify: `src/locales/de.json`
- Modify: `src/locales/es.json`
- Modify: `src/locales/fr.json`
- Modify: `src/locales/zh.json`
- Modify: `src/locales/ja.json`
- Modify: `src/locales/ko.json`

- [ ] **Step 1: Add missing `settings` keys**

Add these keys inside the top-level `"settings"` object in every locale file:

```json
"installApp": "Install {{app}}",
"pwaWorksOffline": "Works offline",
"pwaFasterLoading": "Faster loading",
"pwaAddToHomeScreen": "Add to home screen"
```

Use localized equivalents for each language:
- `en`: `"Install {{app}}"`, `"Works offline"`, `"Faster loading"`, `"Add to home screen"`
- `ru`: `"Установить {{app}}"`, `"Работает офлайн"`, `"Быстрая загрузка"`, `"Добавить на главный экран"`
- `de`: `"{{app}} installieren"`, `"Offline nutzbar"`, `"Schnelleres Laden"`, `"Zum Startbildschirm hinzufügen"`
- `es`: `"Instalar {{app}}"`, `"Funciona sin conexión"`, `"Carga más rápida"`, `"Añadir a pantalla de inicio"`
- `fr`: `"Installer {{app}}"`, `"Fonctionne hors ligne"`, `"Chargement plus rapide"`, `"Ajouter à l’écran d’accueil"`
- `zh`: `"安装 {{app}}"`, `"离线可用"`, `"更快加载"`, `"添加到主屏幕"`
- `ja`: `"{{app}}をインストール"`, `"オフライン利用可能"`, `"高速読み込み"`, `"ホーム画面に追加"`
- `ko`: `"{{app}} 설치"`, `"오프라인 사용 가능"`, `"빠른 로딩"`, `"홈 화면에 추가"`

### Task 2: Add tests for localized PWA banner and segmented call buttons

**Files:**
- Modify: `src/components/SettingsView.test.tsx`
- Modify: `src/components/ContactProfileModal.test.tsx`

- [ ] **Step 1: Extend mocked translations**

In `src/components/SettingsView.test.tsx`, add these mocked keys to the `translations` object:

```ts
'settings.installApp': 'Install {{app}}',
'settings.pwaWorksOffline': 'Works offline',
'settings.pwaFasterLoading': 'Faster loading',
'settings.pwaAddToHomeScreen': 'Add to home screen',
```

In `src/components/ContactProfileModal.test.tsx`, change the mocked `t` to return localized test labels for the new contact keys:

```ts
t: (key: string) => key === 'contacts.videoCall' ? 'Video' : key === 'contacts.call' ? 'Call' : key,
```

- [ ] **Step 2: Add PWA banner test**

Add this test to `src/components/SettingsView.test.tsx`:

```ts
it('renders localized PWA install banner copy', () => {
  render(<SettingsView theme="dark" />);

  expect(screen.getByText('Install Mess&Anger')).toBeInTheDocument();
  expect(screen.getByText('Works offline')).toBeInTheDocument();
  expect(screen.getByText('Faster loading')).toBeInTheDocument();
  expect(screen.getByText('Add to home screen')).toBeInTheDocument();
});
```

- [ ] **Step 3: Add contact video call test**

Add this test to `src/components/ContactProfileModal.test.tsx`:

```ts
it('calls onVideoCall when Video button clicked', () => {
  const props = { ...defaultProps, onVideoCall: vi.fn() };
  render(<ContactProfileModal {...props} />);

  const videoBtn = screen.getByRole('button', { name: 'Video' });
  fireEvent.click(videoBtn);

  expect(props.onVideoCall).toHaveBeenCalled();
  expect(defaultProps.onClose).toHaveBeenCalled();
});
```

### Task 3: Localize and resize PWA install banner

**Files:**
- Modify: `src/components/SettingsView.tsx`

- [ ] **Step 1: Replace hardcoded PWA banner text**

Change this block:

```tsx
<div className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t('settings.installBtn')} Mess&Anger</div>
...
<li>✓ pwa.worksOffline</li>
<li>✓ pwa.fasterLoading</li>
<li>✓ pwa.addToHomeScreen</li>
...
<button onClick={() => { setShowPwaBanner(false); }} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 active:scale-95 transition-transform text-white shadow-sm hover:bg-emerald-600">
  Install
</button>
```

to:

```tsx
<div className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-slate-800"}`}>{t('settings.installApp', { app: 'Mess&Anger' })}</div>
...
<li>{t('settings.pwaWorksOffline')}</li>
<li>{t('settings.pwaFasterLoading')}</li>
<li>{t('settings.pwaAddToHomeScreen')}</li>
...
<button onClick={() => { setShowPwaBanner(false); }} className="flex-1 py-2 rounded-lg text-xs font-bold bg-emerald-500 active:scale-95 transition-transform text-white shadow-sm hover:bg-emerald-600">
  {t('settings.installBtn')}
</button>
```

- [ ] **Step 2: Increase PWA card body spacing**

Change the PWA card class from:

```tsx
className={`w-full rounded-2xl border p-4 mb-2 shadow-lg relative overflow-hidden ${isDark ? "bg-[#1a1d24] border-white/10" : "bg-white border-blue-100"}`}
```

to:

```tsx
className={`w-full rounded-2xl border p-5 mb-2 shadow-lg relative overflow-hidden ${isDark ? "bg-[#1a1d24] border-white/10" : "bg-white border-blue-100"}`}
```

and the list wrapper from:

```tsx
<div className={`text-xs mb-3 relative z-10 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
```

to:

```tsx
<div className={`text-xs mb-4 leading-5 relative z-10 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
```

### Task 4: Add segmented audio/video call UI

**Files:**
- Modify: `src/components/ContactProfileModal.tsx`
- Modify: `src/components/ContactsView.tsx`
- Modify: `src/components/ChatPreviewLayer.tsx`
- Modify: `src/components/Dialpad.tsx`
- Modify: `src/components/app/AppOverlays.tsx`
- Modify: `src/components/features/FeatureViews.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Extend `ContactProfileModal` props**

Change the import to include `Video`:

```ts
import { X, Phone, Video, MessageSquare, Edit, Trash2, Ban, Mail, Send, Star, StarOff } from 'lucide-react';
```

Add `onVideoCall?: () => void;` to `Props`.

Add it to destructuring:

```ts
export const ContactProfileModal = ({ contact, onClose, onCall, onVideoCall, onMessage, onEdit, onDelete, onBlock, onRequestDelete, onToggleFavorite, theme }: Props) => {
```

- [ ] **Step 2: Replace the single call button with a segmented call control**

Replace the existing call/message action block:

```tsx
<div className="flex w-full gap-3 mt-6">
   <button onClick={() => { onCall?.(); onClose(); }} className="flex-1 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white transition-colors active:scale-95 shadow-lg shadow-green-500/20">
      <Phone size={20} fill="currentColor" />
       <span className="text-[10px] font-bold uppercase tracking-wider">{t('contacts.call')}</span>
   </button>
   <button onClick={() => { onMessage?.(); onClose(); }} className="flex-1 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white transition-colors active:scale-95 shadow-lg shadow-blue-500/20">
      <MessageSquare size={20} fill="currentColor" />
       <span className="text-[10px] font-bold uppercase tracking-wider">{t('contacts.message')}</span>
   </button>
</div>
```

with:

```tsx
<div className="w-full mt-6 space-y-3">
  <div className="grid grid-cols-2 gap-3">
    <button onClick={() => { onCall?.(); onClose(); }} className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white transition-colors active:scale-95 shadow-lg shadow-green-500/20">
      <Phone size={20} fill="currentColor" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{t('contacts.call')}</span>
    </button>
    <button onClick={() => { onVideoCall?.(); onClose(); }} className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors active:scale-95 shadow-lg shadow-emerald-500/20">
      <Video size={20} fill="currentColor" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{t('contacts.videoCall')}</span>
    </button>
  </div>
  <button onClick={() => { onMessage?.(); onClose(); }} className="w-full h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white transition-colors active:scale-95 shadow-lg shadow-blue-500/20">
    <MessageSquare size={20} fill="currentColor" />
    <span className="text-[10px] font-bold uppercase tracking-wider">{t('contacts.message')}</span>
  </button>
</div>
```

- [ ] **Step 3: Pass video-call callbacks through parent screens**

In `ContactsView`, add `onVideoCall?: (name: string, color: string) => void;` to props and pass it to `ContactProfileModal`:

```tsx
onVideoCall={() => {
  if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color);
  setSelectedContact(null);
}}
```

In `ChatPreviewLayer`, add `onVideoCall?: (name: string, color?: string) => void;` to the interface and pass it to `ContactProfileModal`:

```tsx
onVideoCall={() => {
  if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color);
  setSelectedContact(null);
}}
```

In `Dialpad`, add `onVideoCall?: (name: string, color?: string) => void;` to `DialpadProps` and pass it to `ContactProfileModal`:

```tsx
onVideoCall={() => {
  if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color);
  setSelectedContact(null);
}}
```

In `FeatureViews`, add `onVideoCall: (name: string, color?: string) => void;` to props and pass it to `ContactsView`.

In `AppOverlays`, add `onProfileVideoCall: () => void;` to props and pass it to `ContactProfileModal`.

In `App.tsx`, make `handlePreviewCall` accept an optional call type:

```ts
const handlePreviewCall = (name: string, color?: string, callType: 'audio' | 'video' = 'audio') => {
  const isVideo = callType === 'video';
  const mockCall = {
    callId: `preview_${Date.now()}`,
    direction: 'outgoing' as const,
    status: 'connecting' as const,
    callType: callType as 'audio' | 'video',
    remotePeer: { peerId: 'preview', displayName: name },
    localStream: null,
    screenStream: null,
    isMuted: false,
    isSpeaker: false,
    isVideoEnabled: isVideo,
    isVideo,
    isRecording: false,
    startTime: Date.now(),
    participants: [],
  };
  useAppStore.getState().setActiveCall(mockCall);
  setView("calls");
};
```

Change `handleProfileCall` to call `handlePreviewCall(globalSelectedContact.name, globalSelectedContact.color, 'audio')` and add:

```ts
const handleProfileVideoCall = () => {
  if (!globalSelectedContact) return;
  if (useAppStore.getState().riskShellActive) {
    registerRiskSession(globalSelectedContact.id, getLastActionDebugId(globalSelectedContact.id));
    toast.warning('Paused by risk shell');
    return;
  }
  handlePreviewCall(globalSelectedContact.name, globalSelectedContact.color, 'video');
  setGlobalSelectedContact(null);
};
```

Pass `onPreviewCall={(name, color) => handlePreviewCall(name, color, 'audio')}` and `onPreviewVideoCall={(name, color) => handlePreviewCall(name, color, 'video')}` to `ChatPreviewLayer`, `onVideoCall={(name, color) => handlePreviewCall(name, color, 'video')}` to `ContactsView`, and `onProfileVideoCall={handleProfileVideoCall}` to `AppOverlays`.

### Task 5: Run verification

**Files:**
- Run: `npm test -- ContactProfileModal SettingsView`
- Run: `npm run lint`

- [ ] **Step 1: Run targeted tests**

Expected: both `ContactProfileModal.test.tsx` and `SettingsView.test.tsx` pass.

- [ ] **Step 2: Run lint/typecheck**

Expected: `npm run lint` exits with code 0.
