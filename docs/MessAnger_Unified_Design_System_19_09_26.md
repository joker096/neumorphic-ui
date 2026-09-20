# MessAnger — Unified Design System & AI Agent Implementation Guide

> Единый файл для визуальной миграции MessAnger.
> Содержит Design Tokens, CSS-компоненты, UI/UX правила и инструкции для AI-агента.
> Цель: приблизить интерфейс к предоставленному glassmorphism-референсу, сохранив фирменный стиль MessAnger и существующую функциональность.

---

# 1. ЦЕЛЬ

Привести весь интерфейс MessAnger к единой современной desktop/mobile Design System:

- dark glassmorphism;
- мягкие полупрозрачные панели;
- глубокий тёмный фон;
- белая/серебристая типографика;
- фирменный зелёный акцент;
- синие unread badges;
- круглые аватары;
- аккуратные hover/active/focus состояния;
- минимальное количество визуального шума;
- плавные микроанимации;
- адаптивность;
- единая система размеров, отступов, радиусов и теней.

ВАЖНО:

Визуальная переработка НЕ должна ломать бизнес-логику, маршрутизацию, API, WebSocket, авторизацию, сообщения, звонки, загрузку файлов и другие существующие функции.

---

# 2. ГЛАВНЫЕ ПРАВИЛА AI-АГЕНТА

AI-АГЕНТ ОБЯЗАН:

1. Сначала изучить существующий компонент.
2. Определить его назначение.
3. Сохранить существующую функциональность.
4. Перевести визуальную часть на классы `.ma-*`.
5. Использовать Design Tokens из этого файла.
6. Не создавать случайные цвета.
7. Не создавать случайные размеры.
8. Не создавать новые радиусы без необходимости.
9. Не дублировать CSS.
10. Не использовать inline styles, если это можно сделать через Design System.
11. Не использовать `!important` без технической причины.
12. Проверять desktop + tablet + mobile.
13. Проверять hover + active + focus + disabled.
14. Проверять keyboard navigation.
15. После каждого крупного изменения проверять, что функциональность не сломана.

AI-АГЕНТ НЕ ДОЛЖЕН:

- превращать интерфейс в копию другого продукта;
- удалять существующие функции ради дизайна;
- менять API;
- менять структуру данных без необходимости;
- менять бизнес-логику;
- добавлять огромные кнопки;
- делать каждый блок отдельной карточкой;
- использовать толстые границы вокруг каждого элемента;
- использовать чрезмерные тени;
- использовать чрезмерный blur;
- использовать кислотные цвета;
- смешивать несколько разных UI-стилей;
- добавлять декоративные элементы, которые мешают работе;
- делать интерфейс визуально перегруженным.

---

# 3. ЕДИНЫЙ CSS

Ниже находится самостоятельный CSS. Его можно использовать как один основной файл, например:

`MessAnger_Design_System.css`

```css
/* ============================================================
   MESSANGER DESIGN SYSTEM
   Unified Glassmorphism UI
   ============================================================ */

:root {
  /* ----------------------------------------------------------
     COLORS
     ---------------------------------------------------------- */

  --ma-bg: #080b0c;
  --ma-bg-2: #0d1112;
  --ma-bg-3: #121718;

  --ma-panel: rgba(27, 32, 33, .72);
  --ma-panel-soft: rgba(255, 255, 255, .045);
  --ma-panel-hover: rgba(255, 255, 255, .075);
  --ma-panel-active: rgba(255, 255, 255, .105);

  --ma-input: rgba(255, 255, 255, .065);

  --ma-border: rgba(255, 255, 255, .11);
  --ma-border-soft: rgba(255, 255, 255, .07);
  --ma-border-strong: rgba(255, 255, 255, .18);

  --ma-text: #f4f7f6;
  --ma-text-secondary: #aab2b2;
  --ma-text-muted: #737d7e;
  --ma-text-disabled: #525a5b;

  --ma-accent: #4ede63;
  --ma-accent-2: #10b981;
  --ma-accent-soft: rgba(78, 222, 99, .13);
  --ma-accent-border: rgba(78, 222, 99, .28);

  --ma-blue: #1683ff;
  --ma-danger: #ff4d5e;
  --ma-warning: #f5b942;
  --ma-online: #4ede63;

  /* ----------------------------------------------------------
     GRADIENTS
     ---------------------------------------------------------- */

  --ma-accent-gradient:
    linear-gradient(135deg, #4ede63, #10b981);

  --ma-panel-gradient:
    linear-gradient(
      135deg,
      rgba(255,255,255,.085),
      rgba(255,255,255,.035)
    );

  --ma-message-out-gradient:
    linear-gradient(
      135deg,
      rgba(16,185,129,.38),
      rgba(78,222,99,.16)
    );

  /* ----------------------------------------------------------
     GLASS
     ---------------------------------------------------------- */

  --ma-blur: 28px;
  --ma-blur-heavy: 40px;
  --ma-saturate: 140%;

  /* ----------------------------------------------------------
     RADIUS
     ---------------------------------------------------------- */

  --ma-radius-xs: 8px;
  --ma-radius-sm: 12px;
  --ma-radius-md: 16px;
  --ma-radius-lg: 20px;
  --ma-radius-xl: 28px;
  --ma-radius-pill: 999px;

  /* ----------------------------------------------------------
     SPACING
     ---------------------------------------------------------- */

  --ma-space-1: 4px;
  --ma-space-2: 8px;
  --ma-space-3: 12px;
  --ma-space-4: 16px;
  --ma-space-5: 20px;
  --ma-space-6: 24px;
  --ma-space-7: 32px;
  --ma-space-8: 40px;

  /* ----------------------------------------------------------
     SHADOWS
     ---------------------------------------------------------- */

  --ma-shadow-sm:
    0 6px 18px rgba(0,0,0,.20);

  --ma-shadow-md:
    0 12px 36px rgba(0,0,0,.30);

  --ma-shadow-lg:
    0 24px 70px rgba(0,0,0,.38);

  --ma-shadow-floating:
    0 18px 55px rgba(0,0,0,.45);

  --ma-shadow-accent:
    0 8px 28px rgba(78,222,99,.20);

  /* ----------------------------------------------------------
     MOTION
     ---------------------------------------------------------- */

  --ma-duration-fast: 140ms;
  --ma-duration: 220ms;
  --ma-duration-slow: 350ms;

  --ma-ease:
    cubic-bezier(.2,.8,.2,1);

  /* ----------------------------------------------------------
     TYPOGRAPHY
     ---------------------------------------------------------- */

  --ma-font:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;

  --ma-font-size-xs: 11px;
  --ma-font-size-sm: 13px;
  --ma-font-size-md: 15px;
  --ma-font-size-lg: 17px;
  --ma-font-size-xl: 20px;
  --ma-font-size-2xl: 26px;

  /* ----------------------------------------------------------
     LAYOUT
     ---------------------------------------------------------- */

  --ma-sidebar-width: 72px;
  --ma-chat-list-width: 380px;
  --ma-profile-width: 360px;

  --ma-header-height: 72px;
  --ma-composer-height: 64px;
}

/* ============================================================
   RESET
   ============================================================ */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  min-height: 100%;
  margin: 0;
}

html {
  color-scheme: dark;
}

body {
  background: var(--ma-bg);
  color: var(--ma-text);
  font-family: var(--ma-font);
  font-size: var(--ma-font-size-md);
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  color: inherit;
}

img {
  max-width: 100%;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

/* ============================================================
   APP BACKGROUND
   ============================================================ */

.ma-app {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 15% 20%,
      rgba(78,222,99,.055),
      transparent 28%
    ),
    radial-gradient(
      circle at 85% 75%,
      rgba(16,185,129,.045),
      transparent 30%
    ),
    var(--ma-bg);
}

.ma-app::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,.018),
      transparent 40%
    );
}

/* ============================================================
   GLASS
   ============================================================ */

.ma-glass {
  background: var(--ma-panel);
  backdrop-filter:
    blur(var(--ma-blur))
    saturate(var(--ma-saturate));
  -webkit-backdrop-filter:
    blur(var(--ma-blur))
    saturate(var(--ma-saturate));
  border: 1px solid var(--ma-border);
  box-shadow: var(--ma-shadow-lg);
}

.ma-panel {
  background: var(--ma-panel);
  backdrop-filter:
    blur(var(--ma-blur))
    saturate(var(--ma-saturate));
  -webkit-backdrop-filter:
    blur(var(--ma-blur))
    saturate(var(--ma-saturate));
  border: 1px solid var(--ma-border);
  border-radius: var(--ma-radius-xl);
}

/* ============================================================
   MAIN LAYOUT
   ============================================================ */

.ma-shell {
  display: grid;
  grid-template-columns:
    var(--ma-sidebar-width)
    var(--ma-chat-list-width)
    minmax(0, 1fr)
    var(--ma-profile-width);

  gap: 10px;

  width: min(1800px, calc(100vw - 32px));
  height: calc(100vh - 32px);
  margin: 16px auto;
}

.ma-navigation,
.ma-chat-list,
.ma-chat,
.ma-profile {
  min-width: 0;
  min-height: 0;
}

/* ============================================================
   NAVIGATION
   ============================================================ */

.ma-navigation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  padding: 12px 8px;

  border-radius: var(--ma-radius-xl);
  background: rgba(22,27,28,.72);

  backdrop-filter: blur(var(--ma-blur));
  -webkit-backdrop-filter: blur(var(--ma-blur));

  border: 1px solid var(--ma-border);
}

.ma-nav-spacer {
  flex: 1;
}

.ma-nav-button {
  position: relative;

  width: 48px;
  height: 48px;

  display: grid;
  place-items: center;

  border: 0;
  border-radius: 16px;

  background: transparent;
  color: var(--ma-text-secondary);

  cursor: pointer;

  transition:
    background var(--ma-duration) var(--ma-ease),
    color var(--ma-duration) var(--ma-ease),
    transform var(--ma-duration) var(--ma-ease);
}

.ma-nav-button:hover {
  color: var(--ma-text);
  background: var(--ma-panel-hover);
}

.ma-nav-button.active {
  color: var(--ma-accent);
  background: var(--ma-accent-soft);
}

.ma-nav-button:active {
  transform: scale(.93);
}

/* ============================================================
   CHAT LIST PANEL
   ============================================================ */

.ma-chat-list {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  background: rgba(22,27,28,.72);
  backdrop-filter: blur(var(--ma-blur));
  -webkit-backdrop-filter: blur(var(--ma-blur));

  border: 1px solid var(--ma-border);
  border-radius: var(--ma-radius-xl);
}

.ma-chat-list-header {
  padding: 18px;
}

.ma-brand {
  display: flex;
  align-items: center;
  gap: 10px;

  font-size: 18px;
  font-weight: 700;
}

.ma-brand-accent {
  color: var(--ma-accent);
}

.ma-search {
  display: flex;
  align-items: center;
  gap: 10px;

  height: 46px;
  padding: 0 14px;

  border-radius: 14px;

  background: var(--ma-input);
  border: 1px solid var(--ma-border-soft);

  color: var(--ma-text-secondary);
}

.ma-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ma-text);
}

.ma-search input::placeholder {
  color: var(--ma-text-muted);
}

.ma-filter-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
  scrollbar-width: none;
}

.ma-filter-row::-webkit-scrollbar {
  display: none;
}

.ma-filter {
  flex: 0 0 auto;

  height: 34px;
  padding: 0 13px;

  border: 1px solid var(--ma-border-soft);
  border-radius: var(--ma-radius-pill);

  background: rgba(255,255,255,.045);
  color: var(--ma-text-secondary);

  cursor: pointer;

  transition:
    background var(--ma-duration) var(--ma-ease),
    color var(--ma-duration) var(--ma-ease);
}

.ma-filter:hover {
  background: var(--ma-panel-hover);
  color: var(--ma-text);
}

.ma-filter.active {
  background: var(--ma-accent-soft);
  border-color: var(--ma-accent-border);
  color: var(--ma-accent);
}

/* ============================================================
   CHAT ITEMS
   ============================================================ */

.ma-chat-items {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 12px;
}

.ma-chat-item {
  position: relative;

  display: flex;
  align-items: center;
  gap: 12px;

  min-height: 68px;
  padding: 10px 12px;

  border-radius: 16px;

  cursor: pointer;

  transition:
    background var(--ma-duration) var(--ma-ease),
    transform var(--ma-duration) var(--ma-ease);
}

.ma-chat-item:hover {
  background: var(--ma-panel-hover);
}

.ma-chat-item.active {
  background: var(--ma-panel-active);
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.07);
}

.ma-chat-item:active {
  transform: scale(.985);
}

.ma-chat-main {
  min-width: 0;
  flex: 1;
}

.ma-chat-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ma-chat-name {
  min-width: 0;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  font-weight: 600;
}

.ma-chat-preview {
  margin-top: 3px;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: var(--ma-text-muted);
  font-size: var(--ma-font-size-sm);
}

.ma-chat-time {
  color: var(--ma-text-muted);
  font-size: var(--ma-font-size-xs);
  white-space: nowrap;
}

/* ============================================================
   AVATAR
   ============================================================ */

.ma-avatar {
  position: relative;

  flex: 0 0 auto;

  width: 48px;
  height: 48px;

  border-radius: 50%;

  object-fit: cover;

  background: #242a2b;

  box-shadow:
    0 0 0 1px rgba(255,255,255,.08),
    0 6px 20px rgba(0,0,0,.25);
}

.ma-avatar.sm {
  width: 38px;
  height: 38px;
}

.ma-avatar.lg {
  width: 92px;
  height: 92px;
}

.ma-avatar.xl {
  width: 128px;
  height: 128px;
}

.ma-avatar-status {
  position: absolute;

  right: 0;
  bottom: 0;

  width: 11px;
  height: 11px;

  border: 2px solid #171c1d;
  border-radius: 50%;

  background: var(--ma-online);
}

.ma-avatar-status.offline {
  background: var(--ma-text-muted);
}

/* ============================================================
   BADGES
   ============================================================ */

.ma-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 21px;
  height: 21px;

  padding: 0 6px;

  border-radius: var(--ma-radius-pill);

  background: var(--ma-blue);
  color: #fff;

  font-size: 11px;
  font-weight: 700;
}

.ma-badge.green {
  background: var(--ma-accent);
  color: #07100a;
}

.ma-badge.danger {
  background: var(--ma-danger);
}

/* ============================================================
   CHAT
   ============================================================ */

.ma-chat {
  position: relative;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  background:
    linear-gradient(
      145deg,
      rgba(20,25,26,.88),
      rgba(12,16,17,.90)
    );

  backdrop-filter: blur(var(--ma-blur));
  -webkit-backdrop-filter: blur(var(--ma-blur));

  border: 1px solid var(--ma-border);
  border-radius: var(--ma-radius-xl);
}

.ma-chat-header {
  height: var(--ma-header-height);

  display: flex;
  align-items: center;
  gap: 12px;

  padding: 10px 18px;

  border-bottom: 1px solid var(--ma-border-soft);
}

.ma-chat-header-info {
  min-width: 0;
  flex: 1;
}

.ma-chat-header-name {
  font-weight: 650;
}

.ma-chat-header-status {
  margin-top: 1px;
  color: var(--ma-accent);
  font-size: var(--ma-font-size-sm);
}

.ma-chat-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ============================================================
   ICON BUTTON
   ============================================================ */

.ma-icon-button {
  width: 42px;
  height: 42px;

  display: grid;
  place-items: center;

  border: 0;
  border-radius: 50%;

  background: rgba(255,255,255,.055);
  color: var(--ma-text-secondary);

  cursor: pointer;

  transition:
    background var(--ma-duration) var(--ma-ease),
    color var(--ma-duration) var(--ma-ease),
    transform var(--ma-duration) var(--ma-ease);
}

.ma-icon-button:hover {
  background: rgba(255,255,255,.11);
  color: var(--ma-text);
}

.ma-icon-button:active {
  transform: scale(.92);
}

.ma-icon-button.primary {
  background: var(--ma-accent-gradient);
  color: #06100a;
  box-shadow: var(--ma-shadow-accent);
}

.ma-icon-button.danger {
  background: var(--ma-danger);
  color: #fff;
}

/* ============================================================
   MESSAGES
   ============================================================ */

.ma-messages {
  flex: 1;

  overflow-y: auto;

  display: flex;
  flex-direction: column;

  gap: 8px;

  padding: 20px;
}

.ma-message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.ma-message-row.outgoing {
  justify-content: flex-end;
}

.ma-message {
  max-width: min(70%, 620px);

  padding: 10px 13px;

  border-radius: 18px 18px 18px 6px;

  background: rgba(255,255,255,.075);
  border: 1px solid rgba(255,255,255,.07);

  color: var(--ma-text);

  box-shadow: var(--ma-shadow-sm);

  animation: ma-message-in var(--ma-duration) var(--ma-ease);
}

.ma-message-row.outgoing .ma-message {
  border-radius: 18px 18px 6px 18px;

  background: var(--ma-message-out-gradient);
  border-color: var(--ma-accent-border);
}

.ma-message-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.ma-message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;

  margin-top: 4px;

  color: rgba(255,255,255,.52);
  font-size: 10px;
}

@keyframes ma-message-in {
  from {
    opacity: 0;
    transform: translateY(5px) scale(.99);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ============================================================
   COMPOSER
   ============================================================ */

.ma-composer-wrap {
  padding: 10px 16px 16px;
}

.ma-composer {
  display: flex;
  align-items: center;
  gap: 8px;

  min-height: 56px;
  padding: 6px 8px 6px 8px;

  background: rgba(25,30,31,.84);

  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);

  border: 1px solid var(--ma-border);
  border-radius: 30px;

  box-shadow: var(--ma-shadow-md);
}

.ma-composer textarea,
.ma-composer input {
  flex: 1;

  min-width: 0;

  resize: none;

  border: 0;
  outline: 0;

  background: transparent;

  color: var(--ma-text);

  font-size: 15px;
}

.ma-composer textarea::placeholder,
.ma-composer input::placeholder {
  color: var(--ma-text-muted);
}

/* ============================================================
   PROFILE PANEL
   ============================================================ */

.ma-profile {
  display: flex;
  flex-direction: column;

  overflow-y: auto;

  padding: 18px;

  background: rgba(22,27,28,.72);

  backdrop-filter: blur(var(--ma-blur));
  -webkit-backdrop-filter: blur(var(--ma-blur));

  border: 1px solid var(--ma-border);
  border-radius: var(--ma-radius-xl);
}

.ma-profile-top {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 24px 10px 20px;

  text-align: center;
}

.ma-profile-name {
  margin-top: 16px;

  font-size: 24px;
  font-weight: 700;
}

.ma-profile-status {
  margin-top: 4px;
  color: var(--ma-accent);
}

.ma-profile-actions {
  display: flex;
  justify-content: center;
  gap: 8px;

  margin: 8px 0 22px;
}

.ma-profile-section {
  padding: 16px 0;

  border-top: 1px solid var(--ma-border-soft);
}

.ma-profile-row {
  display: flex;
  align-items: center;
  gap: 12px;

  min-height: 52px;

  color: var(--ma-text-secondary);

  cursor: pointer;

  transition: color var(--ma-duration) var(--ma-ease);
}

.ma-profile-row:hover {
  color: var(--ma-text);
}

.ma-profile-row-content {
  flex: 1;
}

.ma-profile-row-title {
  color: var(--ma-text);
}

.ma-profile-row-meta {
  margin-top: 2px;
  color: var(--ma-text-muted);
  font-size: var(--ma-font-size-sm);
}

/* ============================================================
   PRIMARY BUTTON
   ============================================================ */

.ma-button {
  min-height: 44px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 0 18px;

  border: 1px solid var(--ma-border);
  border-radius: 14px;

  background: rgba(255,255,255,.065);
  color: var(--ma-text);

  cursor: pointer;

  transition:
    background var(--ma-duration) var(--ma-ease),
    transform var(--ma-duration) var(--ma-ease),
    box-shadow var(--ma-duration) var(--ma-ease);
}

.ma-button:hover {
  background: rgba(255,255,255,.11);
}

.ma-button:active {
  transform: scale(.97);
}

.ma-button.primary {
  background: var(--ma-accent-gradient);
  border-color: transparent;
  color: #06100a;
  font-weight: 650;
  box-shadow: var(--ma-shadow-accent);
}

.ma-button.danger {
  background: var(--ma-danger);
  border-color: transparent;
  color: #fff;
}

/* ============================================================
   DROPDOWN / CONTEXT MENU
   ============================================================ */

.ma-menu {
  min-width: 220px;

  padding: 7px;

  background: rgba(25,30,31,.92);

  backdrop-filter: blur(var(--ma-blur-heavy));
  -webkit-backdrop-filter: blur(var(--ma-blur-heavy));

  border: 1px solid var(--ma-border);
  border-radius: 16px;

  box-shadow: var(--ma-shadow-floating);

  animation: ma-menu-in var(--ma-duration) var(--ma-ease);
}

.ma-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;

  min-height: 42px;

  padding: 0 12px;

  border-radius: 11px;

  color: var(--ma-text-secondary);

  cursor: pointer;

  transition:
    background var(--ma-duration-fast) var(--ma-ease),
    color var(--ma-duration-fast) var(--ma-ease);
}

.ma-menu-item:hover {
  background: rgba(255,255,255,.075);
  color: var(--ma-text);
}

.ma-menu-item.danger {
  color: var(--ma-danger);
}

@keyframes ma-menu-in {
  from {
    opacity: 0;
    transform: translateY(-5px) scale(.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ============================================================
   MODAL
   ============================================================ */

.ma-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;

  display: grid;
  place-items: center;

  padding: 20px;

  background: rgba(0,0,0,.55);

  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.ma-modal {
  width: min(560px, 100%);

  max-height: min(760px, calc(100vh - 40px));

  overflow: auto;

  padding: 24px;

  background: rgba(22,27,28,.92);

  backdrop-filter: blur(var(--ma-blur-heavy));
  -webkit-backdrop-filter: blur(var(--ma-blur-heavy));

  border: 1px solid var(--ma-border);
  border-radius: var(--ma-radius-xl);

  box-shadow: var(--ma-shadow-floating);

  animation: ma-modal-in var(--ma-duration) var(--ma-ease);
}

@keyframes ma-modal-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(.97);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ============================================================
   FORM ELEMENTS
   ============================================================ */

.ma-input,
.ma-select,
.ma-textarea {
  width: 100%;

  min-height: 46px;

  padding: 0 14px;

  border: 1px solid var(--ma-border);
  border-radius: 13px;

  outline: 0;

  background: var(--ma-input);
  color: var(--ma-text);

  transition:
    border-color var(--ma-duration) var(--ma-ease),
    background var(--ma-duration) var(--ma-ease);
}

.ma-textarea {
  min-height: 110px;
  padding: 12px 14px;
  resize: vertical;
}

.ma-input:hover,
.ma-select:hover,
.ma-textarea:hover {
  background: rgba(255,255,255,.085);
}

.ma-input:focus,
.ma-select:focus,
.ma-textarea:focus {
  border-color: var(--ma-accent-border);
  box-shadow: 0 0 0 3px rgba(78,222,99,.08);
}

/* ============================================================
   NOTIFICATION / TOAST
   ============================================================ */

.ma-toast {
  display: flex;
  align-items: center;
  gap: 12px;

  min-width: 280px;
  max-width: 420px;

  padding: 13px 16px;

  background: rgba(24,29,30,.92);

  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);

  border: 1px solid var(--ma-border);
  border-radius: 16px;

  box-shadow: var(--ma-shadow-floating);

  animation: ma-toast-in var(--ma-duration) var(--ma-ease);
}

@keyframes ma-toast-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================================
   DIVIDER
   ============================================================ */

.ma-divider {
  width: 100%;
  height: 1px;
  background: var(--ma-border-soft);
}

/* ============================================================
   EMPTY STATE
   ============================================================ */

.ma-empty {
  flex: 1;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 40px;

  text-align: center;
  color: var(--ma-text-muted);
}

.ma-empty-title {
  margin-top: 14px;
  color: var(--ma-text);
  font-size: 18px;
  font-weight: 650;
}

.ma-empty-description {
  max-width: 420px;
  margin-top: 6px;
}

/* ============================================================
   LOADING
   ============================================================ */

.ma-skeleton {
  position: relative;
  overflow: hidden;

  background: rgba(255,255,255,.055);
  border-radius: 10px;
}

.ma-skeleton::after {
  content: "";
  position: absolute;
  inset: 0;

  transform: translateX(-100%);

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,.07),
      transparent
    );

  animation: ma-skeleton 1.4s infinite;
}

@keyframes ma-skeleton {
  to {
    transform: translateX(100%);
  }
}

/* ============================================================
   SCROLLBARS
   ============================================================ */

.ma-chat-items,
.ma-messages,
.ma-profile,
.ma-modal {
  scrollbar-width: thin;
  scrollbar-color:
    rgba(255,255,255,.16)
    transparent;
}

.ma-chat-items::-webkit-scrollbar,
.ma-messages::-webkit-scrollbar,
.ma-profile::-webkit-scrollbar,
.ma-modal::-webkit-scrollbar {
  width: 6px;
}

.ma-chat-items::-webkit-scrollbar-track,
.ma-messages::-webkit-scrollbar-track,
.ma-profile::-webkit-scrollbar-track,
.ma-modal::-webkit-scrollbar-track {
  background: transparent;
}

.ma-chat-items::-webkit-scrollbar-thumb,
.ma-messages::-webkit-scrollbar-thumb,
.ma-profile::-webkit-scrollbar-thumb,
.ma-modal::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.14);
  border-radius: 999px;
}

.ma-chat-items::-webkit-scrollbar-thumb:hover,
.ma-messages::-webkit-scrollbar-thumb:hover,
.ma-profile::-webkit-scrollbar-thumb:hover,
.ma-modal::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,.24);
}

/* ============================================================
   FOCUS / ACCESSIBILITY
   ============================================================ */

:where(
  button,
  a,
  input,
  textarea,
  select,
  [tabindex]
):focus-visible {
  outline: 2px solid var(--ma-accent);
  outline-offset: 2px;
}

/* ============================================================
   REDUCED MOTION
   ============================================================ */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ============================================================
   TABLET
   ============================================================ */

@media (max-width: 1200px) {
  :root {
    --ma-chat-list-width: 330px;
    --ma-profile-width: 320px;
  }

  .ma-shell {
    grid-template-columns:
      var(--ma-sidebar-width)
      var(--ma-chat-list-width)
      minmax(0, 1fr);
  }

  .ma-profile {
    display: none;
  }
}

/* ============================================================
   SMALL TABLET
   ============================================================ */

@media (max-width: 850px) {
  :root {
    --ma-chat-list-width: 320px;
  }

  .ma-shell {
    width: 100%;
    height: 100vh;
    margin: 0;
    gap: 0;
  }

  .ma-navigation {
    border-radius: 0;
    border-top: 0;
    border-bottom: 0;
    border-left: 0;
  }

  .ma-chat-list {
    border-radius: 0;
    border-top: 0;
    border-bottom: 0;
  }

  .ma-chat {
    border-radius: 0;
    border-top: 0;
    border-bottom: 0;
    border-right: 0;
  }
}

/* ============================================================
   MOBILE
   ============================================================ */

@media (max-width: 650px) {
  .ma-shell {
    display: block;
  }

  .ma-navigation {
    position: fixed;
    z-index: 100;

    left: 10px;
    right: 10px;
    bottom: 10px;

    width: auto;
    height: 64px;

    flex-direction: row;
    justify-content: space-around;

    padding: 8px 10px;

    border: 1px solid var(--ma-border);
    border-radius: 22px;
  }

  .ma-nav-spacer {
    display: none;
  }

  .ma-chat-list {
    width: 100%;
    height: 100vh;
  }

  .ma-chat {
    position: fixed;
    inset: 0;
    z-index: 90;

    width: 100%;
    height: 100vh;

    display: none;
  }

  .ma-chat.mobile-active {
    display: flex;
  }

  .ma-message {
    max-width: 84%;
  }

  .ma-messages {
    padding: 14px;
  }

  .ma-composer-wrap {
    padding: 8px 10px 86px;
  }
}

/* ============================================================
   UTILITY CLASSES
   ============================================================ */

.ma-hidden {
  display: none !important;
}

.ma-flex {
  display: flex;
}

.ma-flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ma-flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ma-gap-1 { gap: var(--ma-space-1); }
.ma-gap-2 { gap: var(--ma-space-2); }
.ma-gap-3 { gap: var(--ma-space-3); }
.ma-gap-4 { gap: var(--ma-space-4); }

.ma-text-muted {
  color: var(--ma-text-muted);
}

.ma-text-secondary {
  color: var(--ma-text-secondary);
}

.ma-text-accent {
  color: var(--ma-accent);
}

.ma-text-danger {
  color: var(--ma-danger);
}

.ma-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ma-no-select {
  user-select: none;
}

.ma-clickable {
  cursor: pointer;
}

/* ============================================================
   END CSS
   ============================================================ */
```

---

# 4. СТРУКТУРА КОМПОНЕНТОВ

Рекомендуемая структура:

```text
App
└── MessengerShell
    ├── Navigation
    ├── ChatList
    │   ├── Brand
    │   ├── Search
    │   ├── ChatFilters
    │   └── ChatItems
    ├── Chat
    │   ├── ChatHeader
    │   ├── Messages
    │   └── Composer
    └── ProfilePanel
```

---

# 5. ПРАВИЛО ИМЕНОВАНИЯ

Все новые стили MessAnger должны использовать namespace:

`ma-`

Примеры:

```text
ma-shell
ma-navigation
ma-nav-button
ma-chat-list
ma-chat-item
ma-avatar
ma-message
ma-composer
ma-profile
ma-button
ma-modal
ma-menu
```

Не создавать:

```text
button2
newButton
customBox
glass2
dark-panel-new
temporary-container
```

---

# 6. КНОПКИ

Основной принцип:

- стандартная кнопка: 42–46 px;
- icon button: около 42 px;
- floating action button: 48–56 px;
- круглая кнопка для основного действия;
- primary action — зелёный gradient;
- destructive action — красный;
- вторичные действия — glass.

Не делать:

- огромные кнопки;
- кнопки высотой 70–80 px без необходимости;
- несколько ярких primary-кнопок одновременно.

---

# 7. GLASSMORPHISM

Использовать:

- прозрачность;
- blur;
- saturation;
- мягкую границу;
- глубокую тень;
- тёмный фон.

Не использовать glassmorphism абсолютно для каждого маленького элемента.

Иерархия:

1. App background
2. Main glass panels
3. Secondary controls
4. Floating elements
5. Messages

Каждый уровень должен визуально отличаться.

---

# 8. СООБЩЕНИЯ

Incoming:

- нейтральный dark glass;
- левая нижняя скруглённая часть немного меньше.

Outgoing:

- зелёный translucent gradient;
- правая нижняя часть немного меньше;
- зелёная граница;
- check/read status в meta.

Сообщения не должны занимать всю ширину.

Рекомендуемая ширина:

`max-width: 70%`

На мобильном:

`max-width: 84%`

---

# 9. CHAT LIST

Каждый элемент должен содержать:

- avatar;
- online status;
- имя;
- preview последнего сообщения;
- время;
- unread badge при необходимости.

Active chat:

- слегка светлее;
- мягкая внутренняя граница;
- без яркой рамки.

Hover:

- лёгкое осветление.

---

# 10. PROFILE

Profile panel должен содержать:

- avatar;
- имя;
- online/offline status;
- call;
- video call;
- search;
- add/contact;
- media;
- files;
- links;
- voice;
- notes;
- about;
- privacy/security information.

Не превращать профиль в длинную страницу из обычных карточек.

---

# 11. SETTINGS

Все настройки должны использовать:

- группы;
- понятные заголовки;
- toggle;
- select;
- input;
- radio;
- descriptive text.

Стиль:

```text
Settings
│
├── Account
├── Privacy
├── Notifications
├── Appearance
├── Chats
├── Calls
├── Storage
├── Security
├── Devices
└── Advanced
```

Каждая группа должна быть визуально связана, но не перегружена рамками.

---

# 12. SEARCH

Search должен:

- быть доступен быстро;
- иметь keyboard focus;
- поддерживать clear;
- показывать результаты группами;
- иметь loading state;
- иметь empty state.

Поиск не должен выглядеть как обычный HTML input.

Использовать `.ma-search`.

---

# 13. MODALS

Modal:

- затемнённый backdrop;
- небольшой background blur;
- glass panel;
- radius 20–28px;
- мягкая тень;
- максимум визуального фокуса на содержимом.

Не открывать modal поверх другого modal без необходимости.

---

# 14. NOTIFICATIONS / TOASTS

Toast должен:

- появляться плавно;
- автоматически исчезать;
- иметь close;
- поддерживать success/info/warning/error;
- не перекрывать основные controls.

---

# 15. MEDIA VIEWER

Media viewer:

```text
┌─────────────────────────────┐
│ ←                         × │
│                             │
│          IMAGE              │
│                             │
│                             │
│  filename.jpg     3 / 24    │
└─────────────────────────────┘
```

Использовать:

- dark backdrop;
- blur;
- минимальные controls;
- zoom;
- previous/next;
- download/share;
- close.

---

# 16. EMOJI / STICKER PICKER

Picker должен использовать тот же glass language:

- tabs;
- search;
- categories;
- rounded controls;
- hover;
- selected state.

Не использовать стандартный browser popup.

---

# 17. CALL UI

Видеозвонок должен использовать:

- full-screen dark background;
- glass controls;
- floating participant tiles;
- microphone;
- camera;
- speaker;
- screen share;
- effects;
- hang up.

Главная destructive action:

```text
red circular button
```

---

# 18. RESPONSIVE

Desktop:

```text
Navigation + Chat List + Chat + Profile
```

Tablet:

```text
Navigation + Chat List + Chat
```

Mobile:

```text
Chat List
       ↓
Chat
```

Profile открывается как отдельный экран/drawer.

Не уменьшать desktop интерфейс механически.

Мобильная версия должна иметь собственную композицию.

---

# 19. ACCESSIBILITY

Каждый интерактивный элемент обязан иметь:

- accessible label;
- keyboard focus;
- visible focus state;
- достаточный hit area;
- disabled state;
- hover только как дополнительное состояние.

Не использовать цвет как единственный способ передать информацию.

---

# 20. АНИМАЦИИ

Основные:

- 140ms — micro interaction;
- 220ms — normal transition;
- 350ms — panel/modal transition.

Анимации:

- opacity;
- translate;
- scale;
- background;
- color.

Не использовать:

- постоянное вращение;
- чрезмерный bounce;
- длинные animations;
- эффекты, мешающие чтению сообщений.

---

# 21. ПОРЯДОК МИГРАЦИИ СУЩЕСТВУЮЩЕГО MESSANGER

AI-агент должен выполнять работу в таком порядке:

## Phase 1 — Audit

Найти:

- global CSS;
- component CSS;
- Tailwind;
- inline styles;
- duplicated styles;
- hardcoded colors;
- oversized buttons;
- inconsistent radius;
- inconsistent spacing.

## Phase 2 — Foundation

Подключить этот Design System.

Проверить:

- body;
- root;
- background;
- typography;
- scrollbar.

## Phase 3 — Main Layout

Исправить:

- sidebar;
- chat list;
- chat;
- profile.

## Phase 4 — Navigation

Перевести:

- icons;
- active states;
- badges;
- tooltips.

## Phase 5 — Chat List

Перевести:

- search;
- filters;
- chat items;
- unread;
- online status.

## Phase 6 — Chat

Перевести:

- header;
- actions;
- messages;
- timestamps;
- read state.

## Phase 7 — Composer

Перевести:

- attachment;
- emoji;
- input;
- send;
- voice.

## Phase 8 — Profile

Перевести:

- avatar;
- actions;
- media;
- files;
- links;
- privacy.

## Phase 9 — Secondary Screens

Перевести:

- contacts;
- groups;
- channels;
- calls;
- settings;
- notifications.

## Phase 10 — Overlays

Перевести:

- modal;
- dropdown;
- context menu;
- toast;
- media viewer;
- emoji picker;
- sticker picker.

## Phase 11 — Responsive

Проверить:

- desktop;
- 1440px;
- 1200px;
- 1024px;
- 850px;
- 650px;
- 480px.

## Phase 12 — QA

Проверить:

- visual consistency;
- functionality;
- keyboard;
- accessibility;
- performance;
- overflow;
- z-index;
- mobile interaction.

---

# 22. КРИТЕРИИ ГОТОВНОСТИ

Работа считается завершённой только если:

- весь основной UI использует Design Tokens;
- нет случайных цветов;
- нет хаотичных радиусов;
- нет чрезмерно больших кнопок;
- нет визуально конфликтующих компонентов;
- glass panels выглядят единообразно;
- chat bubbles единообразны;
- sidebar единообразен;
- profile panel единообразен;
- modals/menu/toasts используют одну систему;
- mobile layout не ломается;
- keyboard navigation работает;
- существующая функциональность сохранена;
- console не содержит новых ошибок;
- нет горизонтального overflow;
- нет случайных `z-index`;
- нет дублирующего CSS.

---

# 23. ФИНАЛЬНОЕ ПРАВИЛО ДЛЯ AI-АГЕНТА

Перед созданием нового UI-компонента агент обязан проверить:

1. Есть ли уже соответствующий компонент?
2. Есть ли для него класс в Design System?
3. Есть ли подходящий token?
4. Можно ли переиспользовать существующий стиль?
5. Не создаётся ли дублирование?
6. Не ломается ли responsive?
7. Не ломается ли существующая функциональность?

Если ответ на пункт 2–4 положительный — использовать существующий Design System.

Новые tokens разрешены только тогда, когда существующие действительно не подходят.

Главная цель:

**MessAnger должен ощущаться как единый коммерческий продукт, а не как набор отдельных экранов, разработанных в разное время разными людьми.**
