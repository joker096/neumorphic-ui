# Цикл «Доведение до идеала» (Ideal Cycle) — от кода до внешнего вида

> **Версия:** 1.0 (2026-09-10)
> **Назначение:** Единый автономный цикл, доводящий приложение до идеала по всем осям: код → мёртвые контролы → безопасность → отказоустойчивость → внешний вид (neumorphic) → a11y → тесты → документация.
> **Связь с AGENTS.md:** Операционная версия «Унифицированного задания» (Этапы 1–6). Детальные циклы: D1–D5 (AGENTS.md §Dead Controls), `UI_CYCLE.md` (Этап 4), `TEST_CYCLE.md` (Этап 6).
> **Машинная версия:** `npm run feature:cycle` = lint + build + test + l10n (3 чистых прохода) — базовый runner для Этапов 0/1.

**Золотое правило:**
> *Любой finding в любом гейте или скане = баг. Исправить → вернуться к Этапу 1. Цикл завершён только при трёх последовательных чистых проходах полного цикла.*

---

## 📊 Живые артефакты

| Файл | Роль |
|------|------|
| `IDEAL_CYCLE.md` | Этот документ — правила цикла |
| `e2e/ui-audit.spec.ts` | Машиночитаемый аудит внешнего вида (Playwright) |
| `test-results/ui-audit-report.json` | Отчёт UI-аудита (findings + summary) |
| `scripts/icon-font-audit.mjs` | Статический icon/font scale audit (I1/F1/F2) |
| `scripts/button-audit.mjs` | Сканер мёртвых кнопок (D5) |
| `scripts/l10n-audit.mjs` | i18n-аудит (пропущенные ключи, RU-литералы) |
| `scripts/feature-cycle.mjs` | Цикл-раннер: lint + build + test + l10n |
| `docs/test-coverage-matrix.md` | Карта покрытия тестами |
| `docs/DESIGN_SYSTEM.md` + `src/styles/tokens.css` | Source of truth внешнего вида |
| `CHANGELOG.md` → `### Fixed` | Фиксация каждого фикса |

---

## 🚦 Машиночитаемые гейты (порог = 0)

| Гейт | Команда | Что меряет |
|------|---------|------------|
| lint+types | `npm run lint` | eslint + tsc |
| build | `npm run build` | vite build |
| unit | `npm test` | vitest (unit + integration) |
| cycle | `npm run feature:cycle` | lint + build + test + l10n, 3 чистых прохода |
| deps | `npm run audit` | npm audit (prod, high+) |
| D5 | `npm run button:audit` | пустые/мёртвые button handlers |
| icon/font static | `npm run icon-font:audit` | I1 (icon off-scale), F1 (font off-ramp), F2 (font < min) |
| icon/font runtime | `npm run test:icon-font` | computed font-size, icon/control ratio |
| i18n | `npm run l10n:audit` | missing keys, RU literals в app-коде |
| внешний вид | `npm run test:ui-audit` | overflow / touch-target / overlap / font-size / contrast |
| a11y/usability | `npm run test:usability` | keyboard / labels / focus |
| e2e | `npm run test:e2e` | user scenarios + offline + ui-audit |

**Правило гейта:** 0 errors. Warning = finding — либо фикс, либо documented known-exception с комментарием-причиной. Ослабление порога без комментария запрещено.

---

## 🔄 ЭТАП 0: БАЗОВАЯ ПРОВЕРКА (baseline)

```
npm run feature:cycle   # lint + build + test + l10n
npm run audit
npm run button:audit
npm run icon-font:audit
npm run test:ui-audit
npm run test:e2e
```

- [ ] Все гейты зелёные (0 errors).

> **🔴 Критерий перехода:** baseline зелёный. Красный — сначала чиним упавшее (не пишем новый код), затем Этап 1.

---

## 🔄 ЭТАП 1: КОДОВЫЙ ЦИКЛ

### 1.1 Структура (AGENTS.md §1.1–1.2)
- [ ] Конфигурация — только `src/config/*`, `src/constants/*`; в компонентах 0 хардкода текстов/цветов/URL/констант.
- [ ] Компонент ≤ 300 строк; один компонент = одна задача.
- [ ] Нет пустых файлов/директорий, нет unused imports.

### 1.2 Мёртвые контролы D1–D5 (AGENTS.md §Dead Controls)
Скан (повторять на каждом проходе):
```
rg -n "role=\"switch\"|role=\"button\"|<button|ToggleSwitch|SettingsRow" src/components
rg -n "onClick=|onToggle=" src/components
```
Для каждого контрола 5 вопросов: id реальный (D1)? действие пишет противоположное значение (D2)? guard no-op (D3)? вложенный интерактив без `stopPropagation` (D4)? handler не пустой (D5)?

### 1.3 Dead code
- [ ] Unused зависимости: import-scan + `npm audit` — 0 ссылок = удалить (devDeps в том числе).
- [ ] `console.log`/`debug`/`debugger` — 0 (одиничные `console.warn` в error-путях допустимы).
- [ ] Закомментированные блоки — 0 (кроме документации).

> **🔴 Критерий перехода:** `button:audit` 0, `lint` 0, D1–D5 findings 0.

---

## 🔄 ЭТАП 2: БЕЗОПАСНОСТНЫЙ ЦИКЛ (OWASP + MASVS + CVE)

### 2.1 Зависимости (A09)
- [ ] `npm audit` (prod): **0 high/critical**. Dev-only advisory = documented accepted risk в CHANGELOG.
- [ ] Уязвимые transitives — pin через `overrides` (house: `qs`, `extract-zip`, `uuid`).
- [ ] Версии зафиксированы lock-файлом.

### 2.2 Секреты (M01, A03)
Скан:
```
rg -n "sk-[A-Za-z0-9]{10,}|AKIA[A-Z0-9]{12,}|BEGIN (RSA|EC) PRIVATE KEY|api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9]{8,}" src server scripts
```
- [ ] 0 ключей/паролей в коде. Ключи — только через env (`process.env`), нет в localStorage.

### 2.3 Клиент (A01, A07, A08)
- [ ] Нет `innerHTML`/`eval`/`new Function`; весь пользовательский ввод экранируется.
- [ ] Крипто — только `lib/crypto` (X25519 ECDH + Ed25519 + HMAC, AES-256-GCM). Кастомной криптографии нет (M05).
- [ ] Валидация всех входных данных; JSON вместо XML (A04).

### 2.4 Сервер (A02, A05, A06)
- [ ] Auth на каждом endpoint (кроме явного public-списка); проверка прав на каждый запрос (M06).
- [ ] Rate-limit на sensitive routes; prepared statements (better-sqlite3); нет дефолтных учёток.
- [ ] CORS строгий (явный origin-список).
- [ ] Нет тестовых endpoints / debug-режимов / бэкдоров в prod (M10).

### 2.5 Заголовки безопасности (prod, A06)
- [ ] `Strict-Transport-Security`, `Content-Security-Policy` (строгая), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.

### 2.6 Хранилище (M02)
- [ ] Чувствительные данные — только через `lib/secureStorage` (шифрование). Токены/ключи не в открытом localStorage/IndexedDB.
- [ ] Сессия: MFA где критично, таймауты, refresh-ротация (M04).

### 2.7 MASVS M01–M10
- [ ] Нативные API корректно (M01), secure storage (M02), HTTPS/TLS везде (M03), биометрия+таймауты (M04), современные алгоритмы (M05), server-side authorization (M06), без debug-инфо в prod (M07), целостность (M08), root/jailbreak detection где применимо (M09).

> **🔴 Критерий перехода:** `npm run audit` 0 high/critical (prod), secret-scan 0, все пункты отмечены.

---

## 🔄 ЭТАП 3: ОТКАЗОУСТОЙЧИВОСТЬ И ПРОИЗВОДИТЕЛЬНОСТЬ

### 3.1 Глобальная обработка ошибок (4.1)
- [ ] Error Boundary + глобальный `unhandledrejection` — любой краш = fallback UI + retry, не смерть приложения.
- [ ] Все async-операции в `try-catch`; все Promise с обработкой.

### 3.2 Graceful Degradation (4.2)
- [ ] Offline: очередь сообщений (idb), кэшированные данные, баннер.
- [ ] Retry с экспоненциальным backoff (max 3), таймауты на все сетевые запросы.
- [ ] Состояния: loading (spinner/skeleton), empty (icon+text), error (сообщение+retry), offline (баннер).

### 3.3 Производительность (4.4)
- [ ] Lazy loading маршрутов; Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1.

> **🔴 Критерий перехода:** `test:e2e` (offline-спеки) зелёный, нет unhandled rejections в консоли.

---

## 🔄 ЭТАП 4: ЦИКЛ ВНЕШНЕГО ВИДА (neumorphic)

Source of truth: `src/styles/tokens.css` + `docs/DESIGN_SYSTEM.md`. Деталь: `UI_CYCLE.md`.

### 4.1 Цвет (токены)
- [ ] Цвет — только токены (`tokens.css`, dark + light). Хардкод hex/rgba в компонентах = finding.
- [ ] Акценты: app = orange (`--accent`), landing = gold (`--gold`). Смешивать запрещается.

### 4.2 Тени (канон)
- [ ] Тени — только канонические: `--shadow-btn-primary`, `--shadow-panel`, `--shadow-modal`.
- Скан:
```
rg -n "box-shadow:\s*0 [0-9]" src/components --glob '!*.test.*'
rg -n "shadow-[0-9a-z .,()-]+" src/components
```
Raw-тень в компоненте = finding.

### 4.3 Icon scale (гейт: I1)
- [ ] Icon size: `12 14 16 18 20 24 28 32`; hero/empty-state: `40 44 48`.

### 4.4 Типографика (гейт: F1/F2)
- [ ] Font ramp: `11 12 13 14 16 18 20 24 28 32 40`; минимум 11px.

### 4.5 Spacing
- [ ] Единая шкала: `4 8 12 16 24 32 48 64` (токены `--space-*` / Tailwind).

### 4.6 Контраст (гейт: `contrast`)
- [ ] WCAG AA: ≥ 4.5:1 обычный текст, ≥ 3:1 крупный (≥24px или ≥18.66px + weight ≥ 600). Проверять **в обеих темах**.

### 4.7 Layout (гейты: `overflow-viewport`, `touch-target`, `overlap`)
- [ ] Нет горизонтального скролла 320–1920px; touch ≥ 44×44px; overlap интерактивов ≤ 30%.

### 4.8 Темы
- [ ] Каждый токен имеет dark + light значение; тёмная по умолчанию, светлая опциональная; обе темы проверены визуально + аудитом.

### 4.9 Motion
- [ ] `prefers-reduced-motion` уважается; длительности 150–300ms; анимируются только `transform`/`opacity` (60 FPS).

> **🔴 Критерий перехода:** `test:ui-audit` 0, `icon-font:audit` 0, `test:icon-font` 0, raw-shadow scan 0.

---

## 🔄 ЭТАП 5: ДОСТУПНОСТЬ (a11y / WCAG AA)

- [ ] Клавиатура: все интерактивы доступны и управляемы (Tab / Enter / Escape / стрелки).
- [ ] Icon-only кнопки — видимый label (house-стиль) или `aria-label`; `focus-visible` на всех фокусируемых.
- [ ] Semantic HTML, `role`, `aria-*`, `alt`, skip-links; `aria-hidden` только для декоративного.
- [ ] Screen reader: форма/диалог объявлены, focus-ловушка в модалках, возврат фокуса при закрытии.

> **🔴 Критерий перехода:** `test:usability` 0 + ручной проход (кнопка-по-кнопке на клавиатуре).

---

## 🔄 ЭТАП 6: ТЕСТОВЫЙ ЦИКЛ (`TEST_CYCLE.md`)

- [ ] Карта покрытия `docs/test-coverage-matrix.md` актуальна: P0 (crypto/auth/storage/server routes) — всегда ✅, P1 — core flows, P2 — визуальное/edge.
- [ ] Каждый фикс Этапов 1–5 = регрессионный тест рядом с компонентом + строка в `CHANGELOG.md` под `### Fixed`.

> **🔴 Критерий перехода:** `npm test` 0, `test:e2e` 0 (или known-flaky зафиксирован в матрице).

---

## 🔄 ЭТАП 7: ДОКУМЕНТАЦИЯ

- [ ] `CHANGELOG.md` — строка про каждый фикс (`### Fixed`), `STATE.md` актуален.
- [ ] Архитектура: новый компонент/модуль = строка в `docs/architecture-messenger-schema.md` / `ARCHITECTURE.md`.
- [ ] `docs/test-coverage-matrix.md` синхронен с реальностью.
- [ ] Новый разработчик разберётся по документации (свежий взгляд).

> **🔴 Критерий перехода:** docs совпадают с кодом (diff-проверка по каждой строке).

---

## 🔄 ЭТАП 8: ФИНАЛЬНЫЕ 3 ПРОХОДА

```
npm run feature:cycle
npm run audit
npm run button:audit
npm run icon-font:cycle
npm run test:ui-audit
npm run test:usability
npm run test:e2e
```

- pass N: все гейты зелёные + 0 findings сканов (D1–D5, секреты, raw-shadow) → счётчик +1.
- любой finding → фикс → **счётчик = 0** → возврат к Этапу 1.

> **✅ Цикл завершён ТОЛЬКО когда:** счётчик = 3 (три последовательных чистых прохода) и все Этапы 0–7 зелёные.

---

## 🚫 АНТИПАТТЕРНЫ

| Антипаттерн | Почему |
|-------------|--------|
| Ослабление порога гейта «чтобы пройти» | Прячет регресс; порог меняется только с комментарием-причиной |
| `aria-hidden` / `disabled` / пустой handler «чтобы сканер молчал» | Прячет D5/UI-баг от аудита и пользователей |
| Хардкод теней/цветов вне токенов | Ломает темы и консистентность neumorphic-системы |
| Фикс только одного viewport/темы | Нарушение вернётся на другом размере/в другой теме |
| Фикс без регрессионного теста и строки в CHANGELOG | Finding повторится на следующем цикле |
| Убирать `stopPropagation` «упростить» | D4 вернётся |
| Синтетические id / запись текущего значения в store | D1/D2, не фикс |
| Чинить один компонент без перескана остальных | Тот же паттерн живёт в других модалках/секциях |

---

## Pass log

| Дата | Findings | Фиксы | Гейты |
|------|----------|-------|-------|
| 2026-09-10 | (цикл создан) | — | baseline: см. прогон по Этапу 0 |
| 2026-09-10 | 2 (stale e2e assertion `groups.spec.ts` — Notifications row удалён WIP-батчем; touch-target 16×44 `CrmFilterBar` company 1440×900) | `e2e/groups.spec.ts` (stale `Notifications` switch-assertion убран, mute-contract + persistence сохранены), `CrmFilterBar.tsx` (desktop-строка `flex-wrap` + Settings2-кнопка `shrink-0` — flex-shrink в side-pane 240–480px сжимал `w-11` до min-content 16px; регрессия `CrmFilterBar.test.tsx` +1: `min-h-11`/`w-11`/`shrink-0`) | lint 0, tsc clean, vitest 5670/5670 (330 файлов), e2e 196/196 — зелёный проход 1/3 |
| 2026-09-10 | 0 | Чистый проход 2/3: перескан D1–D5: 0 findings (empty handlers только test mocks `CallControls`/`ContactItem`/`MemberItem`/`SettingsRow`; `hash_` app-code только `ChatPreviewLayer.tsx:188` = документированный name-matched fallback; все onToggle = инверсия/константа/action-trigger). Код не тронут | lint 0, tsc clean, vitest 5670/5670 (330 файлов), e2e 196/196, button-audit 0, icon-font 0, l10n PASS, audit prod 0 vulnerabilities |
| 2026-09-10 | 0 | Чистый проход 3/3: перескан D1–D5: 0 findings (empty handlers только test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:188`; все onToggle = инверсия/константа/action-trigger). Код не тронут. 3 последовательных зелёных прохода (1/3 + 2/3 + 3/3) → цикл завершён | lint 0, tsc clean, vitest 5670/5670 (330 файлов), e2e 196/196, button-audit 0, icon-font 0, l10n PASS, audit prod 0 vulnerabilities (npm audit endpoint transient error ×2 → retry ok) |
