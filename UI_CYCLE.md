# UI-цикл (UI Cycle) — автономная проверка и фикс UI

> **Версия:** 1.0
> **Назначение:** Бесконечный цикл: аудит (машиночитаемый) → отчёт → фикс нарушений → повторный аудит до 0 нарушений.
> **Связь с AGENTS.md:** Это детальное раскрытие ЭТАПА 2 (UI/UX И АДАПТИВНОСТЬ). Машиночитаемая часть — `e2e/ui-audit.spec.ts`.

**Золотое правило:**
> *Нарушение в отчёте = баг. Исправить и пройти аудит заново. Цикл завершён только при 0 нарушений в трёх подряд прогонах.*

---

## 📊 Живые артефакты

| Файл | Роль |
|------|------|
| `UI_CYCLE.md` | Этот документ — правила цикла |
| `e2e/ui-audit.spec.ts` | Машиночитаемый аудит (Playwright) |
| `test-results/ui-audit-report.json` | Отчёт: все findings + summary (errors/warnings) |
| `scripts/icon-font-audit.mjs` | Статический icon/font scale audit (I1/F1/F2) |
| `e2e/icon-font-audit.spec.ts` | Playwright runtime icon/font audit |
| `test-results/icon-font-audit-report.json` | Icon/font findings + summary (errors/warnings) |

---

## 🔍 ПРОВЕРКИ (что меряет аудит)

| Код проверки | Что | Порог |
|--------------|-----|-------|
| `overflow-viewport` | Нет горизонтального скролла; нет элемента за правым краем вьюпорта | `scrollWidth ≤ innerWidth+1`, `right ≤ innerWidth+1` |
| `touch-target` | Каждый видимый интерактивный элемент имеет hit-area ≥ 44×44 px | `width ≥ 44 && height ≥ 44` |
| `overlap` | Видимые интерактивные элементы не закрывают друг друга | пересечение ≤ 30% площади меньшего |
| `font-size` | Видимый текст читается | `font-size ≥ 12px` |
| `contrast` | Текст проходит WCAG AA | `≥ 4.5:1` (обычный), `≥ 3:1` (крупный ≥24px или ≥18.66px + weight ≥ 600) |

**Интерактивные элементы** (для `touch-target`/`overlap`): `button:not([disabled])`, `a[href]`, `input`, `select`, `textarea`, `[role=button|switch|tab|checkbox|menuitem|option|link]` — видимые и не внутри `[aria-hidden="true"]`.

---

## 🔄 ЭТАП 0: БАЗОВАЯ ПРОВЕРКА (baseline)

```
npm run lint          # eslint + tsc — 0 ошибок
npm run test:ui-audit # аудит (playwright, mock-режим VITE_USE_MOCK=true)
npm run icon-font:audit # статический icon/font scale audit
npm run test:icon-font # runtime icon/font audit (playwright)
```

- [ ] `npm run lint` — 0 ошибок.
- [ ] `npm run test:ui-audit` — 0 нарушений.

> **🔴 Критерий перехода:** baseline зелёный. Красный — сначала фикс, затем Этап 1.

---

## 🔄 ЭТАП 1: ПРОГОН АУДИТА

```
npm run test:ui-audit
```

Матрица прогонов (закодирована в `e2e/ui-audit.spec.ts`):

| Прогон | Viewport | Views |
|--------|----------|-------|
| layout (overflow) | 320×568, 375×667, 390×844, 414×896, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080 | chats |
| полный аудит | 375×667 | chats, contacts, calls, company, workplace, settings, chat-open |
| полный аудит | 1440×900 | chats, contacts, calls, company, workplace, settings, chat-open |
| полный аудит | 768×1024 | chats, settings |
| zoom 200% | 375×667, 1440×900 | chats |

Отчёт пишется в `test-results/ui-audit-report.json` (dedup по `viewport|view|check|element|detail`).

> **🔴 Критерий перехода:** отчёт собран. Если есть findings — Этап 2.

---

## 🔄 ЭТАП 2: ФИКСЫ (по приоритету)

Порядок: `overflow-viewport` → `touch-target` → `contrast` → `font-size` → `overlap`.

### 2.1 `overflow-viewport` (P0 — ломает layout на всех устройствах)
- Длинный текст: `truncate` / `break-words` / `min-w-0` в flex-детях.
- Таблицы/горизонтальные списки: `overflow-x-auto` **на контейнере** (не на `body`), `max-w-full`.
- Абсолютно позиционированные элементы: `max-width: 100vw` или пересчёт `right/left` с учётом `100%`.
- Модалки: `max-w-[calc(100vw-2*padding)]`, `max-h-[calc(100dvh-...)]`.

### 2.2 `touch-target` (P0 — WCAG 2.5.5)
- Кнопка/иконка < 44px: добавить `min-w-[44px] min-h-[44px]` (UI-kit `IconButton`/`Button` уже так делают — использовать их, а не голые `<button>`).
- Визуально маленький контрол (switch, чекбокс): хит-зона через padding, `w-11 h-11` контейнер, `justify-center`.
- Ряд настроек (`SettingsRow`): весь ряд кликабельный и ≥ 44px по высоте.

### 2.3 `contrast` (P0 — WCAG AA)
- Цвет текста — только тем токены (`text-foreground`, `text-muted-foreground`, `text-accent` и др. из `src/styles/tokens.css`). Не хардкод `text-white/40` ниже порога.
- Приглушённый текст: поднять до ≥ 4.5:1 (или ≥ 3:1 для крупного) сменой токена.
- Не «лечить» прозрачностью/blur — менять цвет.
- Градиентные поверхности не измеримы через сплошной фон позади них (глифы аватаров/бейджи на `bg-gradient-*`): чекер пропускает любой узел с `background-image: gradient` в цепочке (см. `e2e/ui-audit.spec.ts` contrast-walk). Ink-на-акценте на градиенте — корректно (9:1); сплошные акцентные заливки продолжают проверяться.

### 2.4 `font-size` (P1)
- Минимум `text-xs` (12px). Ниже 12px — поднять до 12px или убрать декоративный микро-текст.
- Не ломать `text-xs` отступами: если текст в тесном контейнере — расширить контейнер.

### 2.5 `overlap` (P1)
- Интерактивный элемент не может лежать поверх другого интерактивного (>30% площади меньшего).
- Если это осознанный слой (например, экшен поверх сообщения) — внутренний элемент должен быть неинтерактивным (`span`, `pointer-events-none`), а хит-зона одна.
- Баг-закрепление: после фикса добавить/обновить регрессионный assert в e2e, если нарушение воспроизводимо в конкретном view.

**Правило фикса:** баг в коде → фикс кода. Баг в аудите (ложное срабатывание) → фикс `e2e/ui-audit.spec.ts` с комментарием-причиной. **Никогда** не ослаблять порог без комментария.

> **🔴 Критерий перехода:** 0 findings в `test-results/ui-audit-report.json`. Если остались — вернуться к Этапу 2.

---

## 🔄 ЭТАП 3: ПОВТОРНЫЙ ПРОГОН

```
npm run lint
npm run test:ui-audit
npm test        # регресс: фикс UI не сломал логику
```

- [ ] 0 нарушений аудита.
- [ ] 0 ошибок lint.
- [ ] unit-тесты зелёные.

> **🔴 Критерий перехода:** три последовательных зелёных прогона. Любой красный/новый finding — счётчик сбрасывается.

---

## ✅ УСЛОВИЕ ЗАВЕРШЕНИЯ ЦИКЛА

1. ✅ Отчёт: 0 errors, 0 warnings.
2. ✅ Три последовательных зелёных прогона (Этап 3) без новых находок.
3. ✅ В `CHANGELOG.md` — строка про фиксы UI (если были).

**Счётчик сброса:** любой новый finding → счётчик = 0.

---

## Icon/font scale audit

Отдельный от UI-аудита цикл для иконок и шрифтов. Source of truth: `src/styles/tokens.css`.

Команды:

```
npm run icon-font:audit  # node scripts/icon-font-audit.mjs
npm run test:icon-font   # playwright test e2e/icon-font-audit.spec.ts
npm run icon-font:cycle  # cycle runner: lint + test + static audit + e2e audit
```

Шкалы:

| Область | Значения |
|---------|----------|
| Icon `size` | `12 14 16 18 20 24 28 32` |
| Icon hero/empty-state | `40 44 48` |
| Font px ramp | `11 12 13 14 16 18 20 24 28 32 40` |
| Font minimum | `11px` |

Статические проверки:

| Код | Что | Правило |
|-----|-----|---------|
| `I1` | icon-off-scale | `size={N}` вне icon-шкалы; `N >= 100` не проверяется |
| `F2` | font-below-min | font `< 11px` |
| `F1` | font-off-ramp | font `< 40px` и вне font-ramp |

Runtime проверки (`e2e/icon-font-audit.spec.ts`):

| Check | Severity | Правило |
|-------|----------|---------|
| `font-below-min` | error | видимый computed `font-size < 11px` |
| `icon-control` | error | видимый lucide icon внутри control > 60% меньшей стороны control; skip control min side `>= 72px` |
| `icon-text` | warn | icon/text ratio в labeled button вне `[0.8, 1.75]` |

Known exceptions:

- `FormattedText.tsx` `text-[0.9em]` — relative unit, масштабируется вместе с parent.
- `SidebarNav.tsx` inline `fontSize: 13` — вне static class scanner, но соответствует font-ramp.

> **Критерий:** static findings `0`, runtime errors `0`. Cycle завершён только после трёх зелёных прогонов `npm run icon-font:cycle`.

---

## 🚫 АНТИПАТТЕРНЫ

| Антипаттерн | Почему |
|-------------|--------|
| `aria-hidden="true"` на нарушителе, чтобы аудит молчал | Прячет проблему от скринридеров тоже |
| `!important` / inline-стиль только ради аудита | Не решает layout-баг, ломает тему |
| Уменьшение `font-size`/opacity «чтобы контраст прошёл» | Противоположный эффект |
| Ослабление порогов в `auditInPage` без комментария-причины | Прячет регресс |
| Фикс только одного viewport'а | Нарушение вернётся на другом размере |
