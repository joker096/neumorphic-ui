# Full-Screen Hub Layout & Settings Consolidation

## Objective

Move corner controls (language, theme, account) into Settings, and make the radial hub menu and all content views full-screen with proper mobile support. Make the hub button square for better touch usability.

---

## 1. Corner Controls → Settings

### What changes

**Removed from corners:**
- `GlobalControls` (ThemeToggle + LanguageSelector) — removed from `App.tsx` (currently `fixed top-3 right-3 z-[300]`)
- `AccountSwitcher` — removed from `HubView.tsx` (currently `absolute top-6 left-6`)

**Added to Settings:**

Settings main grid (in `SettingsView.tsx`) gets updated:
- **Language** → existing `LanguageSection.tsx` — add LanguageSelector dropdown there
- **Appearance** → existing `AppearanceSettings.tsx` — add ThemeToggle there  
- **Account** → new `AccountSection.tsx` — account switcher UI moved here

### Files to modify
- `src/App.tsx` — remove `<GlobalControls>` element
- `src/components/app/HubView.tsx` — remove `<AccountSwitcher>` element, remove `AccountSwitcher` import
- `src/components/SettingsView.tsx` — add Account item to the main grid, import `AccountSection`
- `src/components/settings/AppearanceSettings.tsx` — integrate `ThemeToggle` component
- `src/components/settings/LanguageSection.tsx` — integrate `LanguageSelector` dropdown

---

## 2. Radial Menu → Full Screen + Square Hub Button

### HubView changes

**Remove scaling:**
```diff
- className="scale-[0.30] min-[400px]:scale-[0.34] sm:scale-[0.6] md:scale-90 lg:scale-100"
+ className="w-full h-full flex items-center justify-center"
```

### RadialMenu changes

**Container sizing:**
- Change `w-[800px] h-[550px]` → `w-full max-w-[800px] aspect-[800/550]`
- This makes the menu responsive: fills available width, maintains aspect ratio

**Hub center button → square:**
- `rounded-full` → `rounded-2xl` (square with rounded corners)
- Keep `CustomDiamondIcon` inside
- Size: same as before (56px when open, `hubR * 2` when closed)
- Better for tap targets on mobile

**Item bubbles:**
- Keep responsive sizing via the aspect-ratio container
- Icons stay at current px sizes (74-80px circles) — they scale proportionally with the viewBox

**Inner controls (DND, Proxy, Energy):**
- No change to layout — they position relative to the SVG viewBox

### Files to modify
- `src/components/app/HubView.tsx` — update className
- `src/components/app/RadialMenu.tsx` — update container from fixed to responsive, change button shape

---

## 3. Content Views → Full Screen

### ContentView changes
- Remove excess mobile padding (`pt-24 sm:pt-8 pb-28 sm:pb-24`)
- Use responsive padding: `px-2 sm:px-4 lg:px-8`

### SettingsView changes
- Remove `max-w-[400px]` constraint → `max-w-2xl lg:max-w-3xl`
- Use full width on mobile, centered max-width on desktop

### Files to modify
- `src/components/app/ContentView.tsx`
- `src/components/SettingsView.tsx`

---

## Files Summary

| File | Change |
|------|--------|
| `src/App.tsx` | Remove `<GlobalControls>` |
| `src/components/app/HubView.tsx` | Remove `<AccountSwitcher>`, remove scaling |
| `src/components/app/RadialMenu.tsx` | Responsive container, square hub button |
| `src/components/app/GlobalControls.tsx` | Delete (no longer needed) |
| `src/components/app/ContentView.tsx` | Reduce mobile padding |
| `src/components/SettingsView.tsx` | Add Account item, remove max-w |
| `src/components/settings/AppearanceSettings.tsx` | Add ThemeToggle |
| `src/components/settings/LanguageSection.tsx` | Add LanguageSelector |
| `src/components/settings/AccountSection.tsx` | New file (account switcher content) |
| `src/components/AccountSwitcher.tsx` | Delete (moved to settings) |
