# Accessibility Checklist — MessAndanger

> Артефакт по брифу `docs/telegram_like_chat.md` §18.1 и §11 (Доступность).
> ✅ есть в коде · 🟡 частично · ❌ отсутствует · ❓ требует проверки.

## A. WCAG AA (бриф §11)

- [x] Контраст текста ≥ 4.5:1 — 🟡 (токены заданы в `tokens.css`; требует аудита пар контраста, особенно tertiary/meta)
- [x] Поддержка dynamic type / font scale — ✅ (`useAppSettings.ts` fontSize, `settings/fontSize`)
- [x] VoiceOver / TalkBack labels — 🟡 (есть `aria-label` на ключевых местах, e.g. `ChatListSearchHeader.tsx:35`; покрытие неполное)
- [ ] Логичный focus order — ❓ (нужен аудит tab-order)
- [x] Focus visible на desktop — 🟡 (нужна проверка outline)
- [x] Reduced motion mode — ✅ (`AnimationContext.tsx`, `prefers-reduced-motion`)
- [x] Крупные hit targets (≥44×44) — ✅ базово; ❓ мелкие контролы
- [x] Текстовые альтернативы для иконок — 🟡 (lucide + aria-label местами)
- [ ] Подписи к media — ❓ (alt для изображений в чате не проверен)
- [ ] Достаточная ширина строк (min 320px, без горизонтального скролла) — ❓ требует проверки 320px
- [x] Не полагаться только на цвет — 🟡 (есть бейджи/иконки, но статусы местами только цветом)

## B. Клавиатурная навигация (бриф §10 Desktop)

- [x] Click → primary action
- [x] Right click → context menu
- [x] Hover → reveal secondary
- [x] Enter → send/submit
- [x] Shift+Enter → new line
- [x] Esc → close modal / cancel selection
- [ ] Cmd/Ctrl+F → search — 🟡 (глобальный search есть, хоткей не проверен)
- [ ] Cmd/Ctrl+K → quick search — ❌

## C. Screen reader / i18n

- [x] RTL/LTR — 🟡 (i18n есть, dir-логика не проверена)
- [x] Plural forms — ✅ (`i18n.tsx` count-параметры)
- [x] Даты/числа по локали — 🟡 (требует аудита)
- [x] Длинные слова (перенос) — ✅ (CSS word-break в чате)

## D. Рекомендации

1. Добавить централизованный `a11y` audit (axe-core / jest-axe) в CI.
2. Проитерировать все интерактивные элементы: явный `aria-label` + `role`.
3. Проверить 320px viewport без горизонтального скролла (бриф §2.1, §16.2).
4. Добавить видимый focus-ring токен в `tokens.css`.
5. Для статусов сообщений (read/delivered) дублировать цвет текстом/иконкой.
