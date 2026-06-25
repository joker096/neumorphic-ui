# Full-Screen Hub Layout & Settings Consolidation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move corner controls (language, theme, account) into Settings, and make the radial hub menu and all content views full-screen with proper mobile support.

**Architecture:** Remove `GlobalControls.tsx` and `AccountSwitcher.tsx` from corners, integrate their content into existing Settings sections (`AppearanceSettings.tsx`, `LanguageSection.tsx`, new `AccountSection.tsx`). Make `RadialMenu` responsive via aspect-ratio container instead of hard-coded pixel scaling. Change hub center button from round to square. Remove `max-w-[400px]` constraint from `SettingsView`.

**Tech Stack:** React, Tailwind CSS v4, Motion (framer-motion), Lucide React

---

### Task 1: Remove GlobalControls from App.tsx and delete the component

**Files:**
- Modify: `src/App.tsx:874-895`
- Modify: `src/components/app/index.ts:4`
- Delete: `src/components/app/GlobalControls.tsx`

- [ ] **Step 1.1: Remove GlobalControls usage from App.tsx**

Remove the import of GlobalControls (line 2):
```
- import { AppOverlays, ContentView, GlobalControls, HubView } from "./components/app";
+ import { AppOverlays, ContentView, HubView } from "./components/app";
```

Remove the `<GlobalControls>` element (lines 882-895):
```diff
-        <GlobalControls
-          isDark={isDark}
-          theme={theme}
-          setTheme={setTheme}
-          showLangMenu={showLangMenu}
-          setShowLangMenu={setShowLangMenu}
-          language={language}
-          setLanguage={(code) => {
-            setLanguage(code);
-            setLang(code);
-            setShowLangMenu(false);
-          }}
-          t={t}
-        />
```

Also remove the unused `showLangMenu` and `setShowLangMenu` state (line 36):
```
-  const [showLangMenu, setShowLangMenu] = useState(false);
```

- [ ] **Step 1.2: Remove GlobalControls export from barrel**

In `src/components/app/index.ts`, remove line 4:
```diff
 export { AppOverlays } from "./AppOverlays";
 export { ContentView } from "./ContentView";
 export { ContentViewHeader } from "./ContentViewHeader";
- export { GlobalControls } from "./GlobalControls";
 export { HubView } from "./HubView";
```

- [ ] **Step 1.3: Delete GlobalControls.tsx**

Delete the file `src/components/app/GlobalControls.tsx`.

---

### Task 2: Remove AccountSwitcher from HubView and delete the component

**Files:**
- Modify: `src/components/app/HubView.tsx`
- Delete: `src/components/AccountSwitcher.tsx`

- [ ] **Step 2.1: Remove AccountSwitcher usage from HubView**

In `src/components/app/HubView.tsx`:
```diff
- import { AccountSwitcher } from "../AccountSwitcher";
 import { RadialMenu } from "../AppChrome";
```

```diff
 export const HubView = ({ theme, items, badges, centerTitle, onItemClick }: HubViewProps) => (
   <motion.div
     key="hub-view"
     className="flex-1 w-full h-[100dvh] bg-transparent flex flex-col items-center justify-center relative z-10"
   >
-    <AccountSwitcher theme={theme} />
     <motion.div
```

- [ ] **Step 2.2: Delete AccountSwitcher.tsx**

Delete the file `src/components/AccountSwitcher.tsx`.

---

### Task 3: Set up setTheme to reach SettingsView through FeatureViews

**Files:**
- Modify: `src/components/features/FeatureViews.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 3.1: Pass setTheme through FeatureViews**

In `src/components/features/FeatureViews.tsx`:
```diff
 type FeatureViewsProps = {
   view: string;
   theme: "light" | "dark";
+  setTheme: (t: "light" | "dark") => void;
   ...
 };
```

```diff
 export const FeatureViews = ({
   view,
   theme,
+  setTheme,
   ...
 }: FeatureViewsProps) => {
   ...
   case "settings":
-    return <SettingsView theme={theme} />;
+    return <SettingsView theme={theme} setTheme={setTheme} />;
```

- [ ] **Step 3.2: Pass setTheme from App.tsx to FeatureViews**

In `src/App.tsx`, find the `<FeatureViews>` call (around line 934) and add `setTheme={setTheme}`:

```diff
                   <FeatureViews
                     view={view}
                     theme={theme}
+                    setTheme={setTheme}
                     contacts={contacts}
```

---

### Task 4: Integrate ThemeToggle into AppearanceSettings

**Files:**
- Modify: `src/components/settings/AppearanceSettings.tsx`

- [ ] **Step 4.1: Add ThemeToggle to AppearanceSettings**

In `src/components/settings/AppearanceSettings.tsx`:
```diff
 import { motion } from 'motion/react';
- import { Download, Palette } from 'lucide-react';
+ import { Download, Palette, Moon, Sun } from 'lucide-react';
 import { useI18n } from '../../lib/i18n';
 import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow, ToggleSwitch } from '../ui/SettingsRow';
 import { SubView } from '../ui/SubView';
+ import { ThemeToggle } from '../app/ThemeToggle';
```

Add the ThemeToggle component after the dark theme toggle row. Replace the current dark theme SettingsToggleRow with a more visual ThemeToggle:

```diff
       <SettingsGroup isDark={isDark}>
-        <SettingsRow
-          icon={<Palette size={16} />}
-          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
-          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
-          title={t('settings.darkTheme')}
-          subtitle={t('settings.darkThemeSubtitle')}
-          isDark={isDark}
-          rightElement={
-            <ToggleSwitch 
-              isOn={isDark} 
-              onToggle={() => setTheme(isDark ? 'light' : 'dark')} 
-              isDark={isDark} 
-            />
-          }
-          onClick={() => setTheme(isDark ? 'light' : 'dark')}
-        />
+        <div className="flex items-center justify-between px-4 py-3">
+          <div className="flex items-center gap-3">
+            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
+              <Palette size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
+            </div>
+            <div>
+              <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.darkTheme')}</div>
+              <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.darkThemeSubtitle')}</div>
+            </div>
+          </div>
+          <ThemeToggle isDark={isDark} theme={theme} setTheme={setTheme} t={t} />
+        </div>
```

---

### Task 5: Create AccountSection.tsx

**Files:**
- Create: `src/components/settings/AccountSection.tsx`

- [ ] **Step 5.1: Create the AccountSection component**

Create new file `src/components/settings/AccountSection.tsx`:

```tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Plus, Check } from 'lucide-react';
import { SubView } from '../ui/SubView';

interface AccountSectionProps {
  isDark: boolean;
  onBack: () => void;
  t: (key: string, options?: any) => string;
}

export const AccountSection = ({ isDark, onBack, t }: AccountSectionProps) => {
  const [activeId, setActiveId] = useState(1);
  const [accounts, setAccounts] = useState([
    { id: 1, name: "Nexus Terminal", color: "from-blue-500 to-cyan-500" },
    { id: 2, name: "Work Node", color: "from-purple-500 to-indigo-500" }
  ]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAddAccount = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newName.trim()) {
      const colors = ["from-green-500 to-emerald-500", "from-pink-500 to-rose-500", "from-yellow-500 to-orange-500"];
      const color = colors[accounts.length % colors.length];
      const newAcc = { id: Date.now(), name: newName.trim(), color };
      setAccounts([...accounts, newAcc]);
      setActiveId(newAcc.id);
      setNewName("");
      setShowAddInput(false);
    }
  };

  const activeAcc = accounts.find(a => a.id === activeId) || accounts[0];

  return (
    <SubView title={t('settings.account')} isDark={isDark} onBack={onBack}>
      <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
        <div className="p-4">
          <div className={`text-[10px] uppercase tracking-widest font-bold mb-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
            {t('settings.accounts')}
          </div>
          <div className="flex flex-col gap-2">
            {accounts.map(acc => (
              <div
                key={acc.id}
                onClick={() => setActiveId(acc.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${isDark ? "hover:bg-[#20242e]" : "hover:bg-slate-100"}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${acc.color} flex-shrink-0`}>
                  {acc.name.charAt(0)}
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <span className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}>{acc.name}</span>
                </div>
                {activeId === acc.id && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-orange-500/20 text-orange-500" : "bg-orange-100 text-orange-600"}`}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
            <div className={`h-[1px] w-full my-1 shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"}`} />
            {showAddInput ? (
              <form onSubmit={handleAddAccount} className="p-2 gap-2 flex items-center shrink-0">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('settings.newAccountPlaceholder')}
                  className={`flex-1 min-w-0 bg-transparent outline-none text-sm transition-colors ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-800 placeholder:text-slate-400"}`}
                />
                <button type="submit" disabled={!newName.trim()} className={`p-1.5 rounded-lg flex-shrink-0 ${newName.trim() ? "bg-orange-500 text-white" : (isDark ? "bg-white/10 text-gray-500" : "bg-black/10 text-slate-400")} transition-colors`}>
                  <Check size={16} />
                </button>
              </form>
            ) : (
              <div
                onClick={() => setShowAddInput(true)}
                className={`flex items-center gap-3 p-3 shrink-0 rounded-2xl cursor-pointer transition-colors ${isDark ? "hover:bg-[#20242e] text-orange-400" : "hover:bg-slate-100 text-orange-600"}`}
              >
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isDark ? "bg-orange-500/10" : "bg-orange-500/10"}`}>
                  <Plus size={20} />
                </div>
                <span className="text-sm font-bold">{t('settings.addAccount')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </SubView>
  );
};
```

---

### Task 6: Add Account section to SettingsView and remove max-w constraint

**Note:** LanguageSection.tsx does not need modification — it already has a proper full-page language picker. The LanguageSelector component remains in the codebase (exported from AppChrome.tsx) for potential future use.

**Files:**
- Modify: `src/components/SettingsView.tsx`

- [ ] **Step 6.1: Import AccountSection in SettingsView**

```diff
 import { AppearanceSettings } from './settings/AppearanceSettings';
 import { LanguageSection } from './settings/LanguageSection';
 import { PrivacySection } from './settings/PrivacySection';
+ import { AccountSection } from './settings/AccountSection';
```

- [ ] **Step 6.2: Add Account render function in SettingsView**

Add after `renderLanguageSettings` (around line 434):

```tsx
  const renderAccountSettings = () => (
    <AccountSection
      isDark={isDark}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );
```

- [ ] **Step 6.3: Add account route in the AnimatePresence section**

Around line 546:
```diff
         {activeSection === 'language' && renderLanguageSettings()}
+        {activeSection === 'account' && renderAccountSettings()}
         {activeSection === 'security' && ...}
```

- [ ] **Step 6.4: Add Account button to the main settings grid**

Find the account section (lines 203-224) and replace the inline account UI with a button that navigates to the account sub-page:

```diff
-        <div className="w-full">
-          <SettingsSectionTitle title={t('settings.accountSection')} isDark={isDark} />
-          <div className="rounded-xl overflow-hidden">
-            <div className={`rounded-xl p-4 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
-              <div className="flex items-center gap-3 mb-3">
-                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold ${isDark ? "bg-emerald-500" : "bg-emerald-600"} shadow-md`}>J</div>
-                <div className="flex-1 min-w-0">
-                  <div className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Joker</div>
-                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>@joker</div>
-                </div>
-              </div>
-              <div className={`border-t ${isDark ? "border-white/5" : "border-black/5"} my-1`} />
-              <button onClick={() => {
-                toast.info(t('settings.accountManagement'), { description: t('settings.accountRequiresAuth') });
-              }} className={`w-full flex items-center gap-3 px-1 py-2 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
-                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
-                  <UserPlus size={14} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
-                </div>
-                <div className={`flex-1 text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.addAccount')}</div>
-              </button>
-            </div>
-          </div>
-        </div>
+        <button onClick={() => setActiveSection('account')} className={`w-full rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-emerald-500/10 to-transparent border border-white/5 hover:bg-white/5" : "bg-gradient-to-br from-emerald-50 to-transparent border border-emerald-100 hover:bg-emerald-50/50"}`}>
+          <div className="flex items-center gap-3">
+            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
+              <UserPlus size={18} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
+            </div>
+            <div className="flex-1 min-w-0">
+              <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.account')}</div>
+              <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.accountSubtitle')}</div>
+            </div>
+          </div>
+        </button>
```

- [ ] **Step 6.5: Remove max-w-[400px] constraint from SettingsView container**

Change line 542:
```diff
-    <div className={`w-full max-w-[400px] flex-1 flex flex-col rounded-[32px] p-6 mb-8 h-full min-h-0 ${isDark ? "..." : "..."}`}>
+    <div className={`w-full max-w-2xl lg:max-w-3xl flex-1 flex flex-col rounded-[32px] p-6 mb-8 h-full min-h-0 ${isDark ? "..." : "..."}`}>
```

---

### Task 7: Make RadialMenu responsive and hub button square

**Files:**
- Modify: `src/components/app/HubView.tsx`
- Modify: `src/components/app/RadialMenu.tsx`

- [ ] **Step 7.1: Remove scaling from HubView**

```diff
-      className="relative z-10 scale-[0.30] min-[400px]:scale-[0.34] sm:scale-[0.6] md:scale-90 lg:scale-100 flex-1 flex flex-col items-center justify-center"
+      className="relative z-10 w-full h-full flex items-center justify-center"
```

- [ ] **Step 7.2: Make RadialMenu container responsive**

In `src/components/app/RadialMenu.tsx`, line 94:
```diff
-      className="relative w-[800px] h-[550px] overflow-visible select-none"
+      className="relative w-full max-w-[800px] aspect-[800/550] overflow-visible select-none"
```

- [ ] **Step 7.3: Make hub center button square with rounded corners**

Find the center button div (around line 370). Change `rounded-full` to `rounded-2xl`:

```diff
-        className={`absolute rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 z-30 group ${
+        className={`absolute rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 z-30 group ${
```

Also update the inner diamond icon container (around line 422):
```diff
-                  className={`w-16 h-16 rounded-full flex items-center justify-center ...`}
+                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ...`}
```

---

### Task 8: Make ContentView full-screen on mobile

**Files:**
- Modify: `src/components/app/ContentView.tsx`

- [ ] **Step 8.1: Reduce mobile padding**

Change line 45:
```diff
-    className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative z-20 pt-24 sm:pt-8 pb-28 sm:pb-24 h-full min-h-0 px-0 sm:px-4"
+    className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative z-20 pt-4 sm:pt-8 pb-20 sm:pb-24 h-full min-h-0 px-2 sm:px-4"
```

---

### Task 9: Add translation keys for account section

**Files:**
- Modify: `src/locales/en.json`

- [ ] **Step 9.1: Add account-related translation keys**

Add to `src/locales/en.json` under the `settings` section:
```json
    "account": "Account",
    "accountSubtitle": "Manage your accounts",
    "accounts": "Accounts",
    "addAccount": "Add Account",
    "newAccountPlaceholder": "Account name..."
```

Also add to `src/locales/ru.json` (and other locale files if needed):
```json
    "account": "Аккаунт",
    "accountSubtitle": "Управление аккаунтами",
    "accounts": "Аккаунты",
    "addAccount": "Добавить аккаунт",
    "newAccountPlaceholder": "Имя аккаунта..."
```

---

### Task 10: Verify all tests pass

- [ ] **Step 10.1: Run the tests**

Run: `npx vitest run`
Expected: All tests pass (364+)
