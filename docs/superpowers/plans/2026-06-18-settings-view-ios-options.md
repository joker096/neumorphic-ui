# Settings View iOS-Style Appearance and Quick Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Settings screen around the selected iOS-style grouped layout, adding cleaner appearance controls and quick inline options without changing unrelated security, privacy, storage, network, location, or bot behavior.

**Architecture:** Keep the existing `SettingsView.tsx` component as the single settings screen, but introduce small focused UI helpers (`SettingsGroup`, `SettingsRow`, `SettingsSectionTitle`, `SegmentedOption`) inside the same file for maintainability. Move common row rendering out of JSX noise so the screen can use iOS-style grouped cards, larger hit areas, inline toggles, and compact section headers.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, `lucide-react`, `motion/react`, Zustand app store, existing `src/lib/i18n` translations, Vitest + React Testing Library.

---

### Task 1: Add focused Settings UI helper components

**Files:**
- Modify: `src/components/SettingsView.tsx:54-104`

- [ ] **Step 1: Replace the existing `SettingsItem` with focused helpers**

Replace the current broad `SettingsItemProps` and `SettingsItem` implementation with these components:

```tsx
interface SettingsSectionTitleProps {
  title: string;
  isDark: boolean;
}

const SettingsSectionTitle = ({ title, isDark }: SettingsSectionTitleProps) => (
  <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
    {title}
  </div>
);

interface SettingsGroupProps {
  children: React.ReactNode;
  isDark: boolean;
  className?: string;
}

const SettingsGroup = ({ children, isDark, className = "" }: SettingsGroupProps) => (
  <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"} ${className}`}>
    {children}
  </div>
);

interface SettingsRowProps {
  key?: React.Key;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  isDark: boolean;
  value?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const SettingsRow = ({ icon, iconBg, iconColor, title, subtitle, isDark, value, rightElement, onClick, className = "" }: SettingsRowProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-b-0 ${isDark ? "border-white/5 hover:bg-white/5" : "border-black/5 hover:bg-black/5"} ${className}`}
  >
    {icon && (
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{title}</div>
      {subtitle && <div className={`text-xs mt-0.5 truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>{subtitle}</div>}
    </div>
    {rightElement ? (
      rightElement
    ) : (
      <>
        {value && (
          <span className={`text-xs font-medium mr-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>{value}</span>
        )}
        <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
      </>
    )}
  </button>
);

interface SettingsToggleRowProps {
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  isOn: boolean;
  isDark: boolean;
  onToggle: () => void;
}

const SettingsToggleRow = ({ icon, iconBg, iconColor, title, subtitle, isOn, isDark, onToggle }: SettingsToggleRowProps) => (
  <SettingsRow
    icon={icon}
    iconBg={iconBg}
    iconColor={iconColor}
    title={title}
    subtitle={subtitle}
    isDark={isDark}
    rightElement={<ToggleSwitch isOn={isOn} onToggle={onToggle} isDark={isDark} />}
    onClick={onToggle}
  />
);
```

- [ ] **Step 2: Update old `SettingsItem` usages in the touched area**

Change all `SettingsItem` occurrences in the main screen and Appearance sub-view to `SettingsRow`, except rows that need inline toggles should use `SettingsToggleRow`.

Expected after this step: TypeScript still compiles, but tests may need updates because row class names changed.

- [ ] **Step 3: Run targeted tests**

Run:

```bash
npm test -- SettingsView.test.tsx
```

Expected: existing tests pass or only fail because expected texts/classes changed.

---

### Task 2: Add appearance controls with iOS-style quick options

**Files:**
- Modify: `src/components/SettingsView.tsx:1008-1037`
- Modify: `src/locales/en.json:350-517`
- Modify: `src/locales/ru.json:246-413`
- Test: `src/components/SettingsView.test.tsx:254-451`

- [ ] **Step 1: Add missing translation keys**

In `src/locales/en.json` and `src/locales/ru.json`, add these keys inside `settings`:

```json
"appearanceDescription": "Theme, text size, animations, and PWA prompt",
"quickOptions": "Quick options",
"notificationsOption": "Message notifications",
"soundOption": "Notification sound",
"cloudSyncOption": "Cloud sync",
"pwaPrompt": "PWA install prompt",
"darkThemeSubtitle": "Switch between light and dark mode",
"fontSizeSubtitle": "Small, medium, or large interface text",
"animationsSubtitle": "Enable motion effects and spring transitions",
"pwaPromptSubtitle": "Show install banner on supported browsers"
```

Russian values:

```json
"appearanceDescription": "Тема, размер текста, анимации и PWA-баннер",
"quickOptions": "Быстрые опции",
"notificationsOption": "Оповещения о сообщениях",
"soundOption": "Звук уведомления",
"cloudSyncOption": "Облачная синхронизация",
"pwaPrompt": "PWA-баннер установки",
"darkThemeSubtitle": "Переключение светлой и тёмной темы",
"fontSizeSubtitle": "Мелкий, средний или крупный текст",
"animationsSubtitle": "Анимации и пружинные переходы",
"pwaPromptSubtitle": "Показывать баннер установки в поддерживаемых браузерах"
```

- [ ] **Step 2: Replace the Appearance sub-view**

Replace the current Appearance sub-view with:

```tsx
{activeSection === 'appearance' && (
  <SubView key="appearance" title={appearance} isDark={isDark} onBack={() => setActiveSection('main')}>
    <SettingsSectionTitle title={t('settings.appearanceDescription')} isDark={isDark} />
    <SettingsGroup isDark={isDark}>
      <SettingsRow
        icon={<Palette size={16} />}
        iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
        iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
        title={t('settings.darkTheme')}
        subtitle={t('settings.darkThemeSubtitle')}
        isDark={isDark}
        rightElement={<ToggleSwitch isOn={isDark} onToggle={() => setTheme?.(isDark ? 'light' : 'dark')} isDark={isDark} />}
        onClick={() => setTheme?.(isDark ? 'light' : 'dark')}
      />
      <SettingsRow
        icon={<span className="text-sm font-bold">Aa</span>}
        iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
        iconColor={isDark ? "text-blue-400" : "text-blue-600"}
        title={t('settings.fontSize')}
        subtitle={t('settings.fontSizeSubtitle')}
        isDark={isDark}
        value={fontSize}
        onClick={() => setFontSize(fontSize === t('settings.fontSizeSmall') ? t('settings.fontSizeMedium') : fontSize === t('settings.fontSizeMedium') ? t('settings.fontSizeLarge') : t('settings.fontSizeSmall'))}
      />
      <SettingsToggleRow
        icon={<span className="text-sm font-bold">✦</span>}
        iconBg={isDark ? "bg-purple-500/10" : "bg-purple-100"}
        iconColor={isDark ? "text-purple-400" : "text-purple-600"}
        title={t('settings.animations')}
        subtitle={t('settings.animationsSubtitle')}
        isOn={uiAnimations}
        isDark={isDark}
        onToggle={() => setUiAnimations(!uiAnimations)}
      />
      <SettingsToggleRow
        icon={<Download size={16} />}
        iconBg={isDark ? "bg-cyan-500/10" : "bg-cyan-100"}
        iconColor={isDark ? "text-cyan-400" : "text-cyan-600"}
        title={t('settings.pwaPrompt')}
        subtitle={t('settings.pwaPromptSubtitle')}
        isOn={showPwaBanner}
        isDark={isDark}
        onToggle={() => setShowPwaBanner(!showPwaBanner)}
      />
    </SettingsGroup>
  </SubView>
)}
```

- [ ] **Step 3: Add tests for Appearance sub-view**

Unskip and update the Appearance navigation test:

```tsx
it('navigates to Appearance sub-view when clicked', () => {
  render(<SettingsView {...defaultProps} />);

  fireEvent.click(screen.getByText('Theme'));

  expect(screen.getByText('Appearance')).toBeInTheDocument();
  expect(screen.getByText('Dark Theme')).toBeInTheDocument();
  expect(screen.getByText('Font Size')).toBeInTheDocument();
  expect(screen.getByText('UI Animations')).toBeInTheDocument();
  expect(screen.getByText('PWA install prompt')).toBeInTheDocument();
});
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm test -- SettingsView.test.tsx
```

Expected: PASS.

---

### Task 3: Add quick options to the main Settings screen

**Files:**
- Modify: `src/components/SettingsView.tsx:783-834`
- Test: `src/components/SettingsView.test.tsx:294-320`

- [ ] **Step 1: Add a Quick Options group under Appearance**

Inside `renderMainSettings`, after the Appearance section group and before Notifications, add:

```tsx
<div className="w-full">
  <SettingsSectionTitle title={t('settings.quickOptions')} isDark={isDark} />
  <SettingsGroup isDark={isDark}>
    <SettingsToggleRow
      icon={<Bell size={16} />}
      iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
      iconColor={isDark ? "text-red-400" : "text-red-600"}
      title={t('settings.notificationsOption')}
      isOn={notificationsEnabled}
      isDark={isDark}
      onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
    />
    <SettingsToggleRow
      title={t('settings.soundOption')}
      isOn={soundEnabled}
      isDark={isDark}
      onToggle={() => setSoundEnabled(!soundEnabled)}
    />
    <SettingsToggleRow
      icon={<Cloud size={16} />}
      iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
      iconColor={isDark ? "text-blue-400" : "text-blue-600"}
      title={t('settings.cloudSyncOption')}
      isOn={storeCloudSync.enabled}
      isDark={isDark}
      onToggle={() => storeSetCloudSyncEnabled(!storeCloudSync.enabled)}
    />
  </SettingsGroup>
</div>
```

- [ ] **Step 2: Keep the old Notifications and Cloud Sync sections**

Do not remove the existing Notifications section or Cloud Sync section. The quick options are shortcuts only; full sections remain available.

- [ ] **Step 3: Add a test for quick options**

```tsx
it('shows quick options on the main settings screen', () => {
  render(<SettingsView {...defaultProps} />);

  expect(screen.getByText('Quick options')).toBeInTheDocument();
  expect(screen.getByText('Message notifications')).toBeInTheDocument();
  expect(screen.getByText('Notification sound')).toBeInTheDocument();
  expect(screen.getByText('Cloud sync')).toBeInTheDocument();
});
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm test -- SettingsView.test.tsx
```

Expected: PASS.

---

### Task 4: Polish the main Settings grouping and account block

**Files:**
- Modify: `src/components/SettingsView.tsx:751-782`
- Modify: `src/components/SettingsView.tsx:783-995`
- Test: `src/components/SettingsView.test.tsx:278-293`

- [ ] **Step 1: Replace the Account section JSX with grouped helpers**

Change the Account section to use `SettingsGroup` and `SettingsRow`:

```tsx
<div className="w-full">
  <SettingsSectionTitle title={t('settings.accountSection')} isDark={isDark} />
  <SettingsGroup isDark={isDark}>
    <SettingsRow
      icon={<div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-md">J</div>}
      title="Joker"
      subtitle="@joker"
      isDark={isDark}
    />
    <SettingsRow
      icon={<div className="w-8 h-8 rounded-full border border-current border-dashed flex items-center justify-center shrink-0 opacity-70"><UserPlus size={14} className={isDark ? "text-emerald-400" : "text-emerald-600"} /></div>}
      title={t('settings.addAccount')}
      isDark={isDark}
      onClick={() => {
        toast.info(t('toast.accountManagement'), { description: t('toast.accountRequiresAuth') });
      }}
    />
  </SettingsGroup>
</div>
```

- [ ] **Step 2: Convert main section cards to helper groups**

Replace each main section card with:

```tsx
<div className="w-full">
  <SettingsSectionTitle title={...} isDark={isDark} />
  <SettingsGroup isDark={isDark}>
    <SettingsRow ... />
  </SettingsGroup>
</div>
```

Keep all existing titles, icons, values, toggles, and navigation behavior unchanged.

- [ ] **Step 3: Add a test for the grouped account layout**

```tsx
it('shows grouped Account section with user info', () => {
  render(<SettingsView {...defaultProps} />);

  expect(screen.getByText('Account')).toBeInTheDocument();
  expect(screen.getByText('Joker')).toBeInTheDocument();
  expect(screen.getByText('@joker')).toBeInTheDocument();
  expect(screen.getByText('Add account')).toBeInTheDocument();
});
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm test -- SettingsView.test.tsx
```

Expected: PASS.

---

### Task 5: Clean up hardcoded strings touched by the settings redesign

**Files:**
- Modify: `src/components/SettingsView.tsx:1022-1133`
- Modify: `src/components/SettingsView.tsx:1145-1207`
- Modify: `src/locales/en.json:350-517`
- Modify: `src/locales/ru.json:246-413`
- Test: `src/components/SettingsView.test.tsx:62-230`

- [ ] **Step 1: Replace hardcoded Security strings**

Replace these strings in the Security sub-view:

```tsx
title="App Lock PIN"
title="Cloud Password (TOTP)"
title="Auto-wipe (Dead Man's Switch)"
```

with:

```tsx
title={t('settings.appLockPin')}
title={t('settings.cloudPasswordTitle')}
title={t('settings.deadMansSwitch')}
```

Add English/Russian translations:

```json
"appLockPin": "App Lock PIN",
"cloudPasswordTitle": "Cloud Password (TOTP)",
"deadMansSwitch": "Auto-wipe (Dead Man's Switch)"
```

```json
"appLockPin": "PIN блокировки приложения",
"cloudPasswordTitle": "Облачный пароль (TOTP)",
"deadMansSwitch": "Автоочистка (Dead Man's Switch)"
```

- [ ] **Step 2: Replace hardcoded Recovery modal strings**

Replace:

```tsx
placeholder="word1 word2 word3 ..."
'Restore'
'Cancel'
```

with:

```tsx
placeholder={t('settings.recoveryPhrasePlaceholder')}
{t('settings.restore')}
{t('settings.cancel')}
```

Add English/Russian translations:

```json
"recoveryPhrasePlaceholder": "word1 word2 word3 ...",
"restore": "Restore",
"cancel": "Cancel"
```

```json
"recoveryPhrasePlaceholder": "слово1 слово2 слово3 ...",
"restore": "Восстановить",
"cancel": "Отмена"
```

- [ ] **Step 3: Add tests for missing translations**

```tsx
it('uses translations for security and recovery strings', () => {
  render(<SettingsView {...defaultProps} />);

  fireEvent.click(screen.getByText('Security'));

  expect(screen.getByText('App Lock PIN')).toBeInTheDocument();
  expect(screen.getByText('Cloud Password (TOTP)')).toBeInTheDocument();
  expect(screen.getByText("Auto-wipe (Dead Man's Switch)")).toBeInTheDocument();
});
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm test -- SettingsView.test.tsx
```

Expected: PASS.

---

### Task 6: Run full verification and fix regressions

**Files:**
- Modify as needed after failures

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run lint and typecheck**

Run:

```bash
npm run lint
```

Expected: ESLint and TypeScript checks pass.

- [ ] **Step 3: Fix any failures from the redesign**

If `npm run lint` reports TypeScript errors in `SettingsView.tsx`, update helper props or row usage so every `SettingsRow` receives required `title` and `isDark` values.

If tests fail because text is translated differently, update only the mock translation keys in `SettingsView.test.tsx`, not production behavior.

- [ ] **Step 4: Re-run verification**

Run again:

```bash
npm test
npm run lint
```

Expected: both commands pass.

---

### Task 7: Commit the completed settings redesign

**Files:**
- All modified files from Tasks 1-6

- [ ] **Step 1: Inspect changed files**

Run:

```bash
git status --short
```

Expected: only settings UI, locale, and test files are changed.

- [ ] **Step 2: Stage relevant files**

Run:

```bash
git add src/components/SettingsView.tsx src/components/SettingsView.test.tsx src/locales/en.json src/locales/ru.json docs/superpowers/plans/2026-06-18-settings-view-ios-options.md
```

- [ ] **Step 3: Commit**

Run:

```bash
git commit -m "feat: redesign settings appearance and quick options"
```

Expected: commit succeeds.
