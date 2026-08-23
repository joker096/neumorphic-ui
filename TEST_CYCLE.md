# Тестовый цикл (Test Cycle) — автономная проверка и дописывание тестов

> **Версия:** 1.0  
> **Назначение:** Бесконечный цикл: инвентаризация → карта покрытия → дописание тестов → прогон → фикс → повтор.  
> **Связь с AGENTS.md:** Этот цикл — детальное раскрытие ЭТАПА 6 (ФИНАЛЬНОЕ ТЕСТИРОВАНИЕ). Срабатывает на каждом проходе общего цикла и отдельно по команде.

**Золотое правило:**  
> *Каждое поведение функции покрыто тестом. Каждый пользовательский сценарий покрыт e2e. Если найден разрыв — закрыть его и начать прогон заново.*

---

## 📊 Живые артефакты

| Файл | Роль |
|------|------|
| `TEST_CYCLE.md` | Этот документ — правила цикла |
| `docs/test-coverage-matrix.md` | Живая карта: функция → тест → статус (P0/P1/P2) |
| `test-results/` | Artifacts Playwright (trace/screenshot при падении) |

---

## 🔄 ЭТАП 0: БАЗОВАЯ ПРОВЕРКА (baseline)

```
npm test            # vitest: unit + integration (141+ файлов, 3900+ тестов)
npm run lint        # eslint + tsc
npx playwright test # e2e (mock-режим: VITE_USE_MOCK=true, webServer из playwright.config.ts)
```

- [ ] `npm test` — 0 падений.
- [ ] `npm run lint` — 0 ошибок.
- [ ] `npx playwright test` — 0 падений (или зафиксированы как known-flaky в матрице).

> **🔴 Критерий перехода:** baseline зелёный. Если красный — сначала чиним упавшие тесты (не пишем новые), затем Этап 1.

---

## 🔄 ЭТАП 1: ИНВЕНТАРИЗАЦИЯ ФУНКЦИЙ

Собрать полный список тестируемых единиц:

1. **Модули (unit):** каждый `.ts/.tsx` в `src/lib`, `src/utils`, `src/store`, `src/services`, `src/hooks`, `src/config`, `server/*` — каждый экспорт = минимум один тест.
2. **Компоненты:** каждый `.tsx` в `src/components` — рендер + основные взаимодействия.
3. **API endpoints:** каждый `handleXRoute`/`handleX` в `server/routes/*` — 200/400/401/404 + validation.
4. **User flows:** каждый сценарий из таблицы ниже (Этап 4).
5. **Security-пути:** crypto, key derivation, storage, auth, rate limit, CSP — всегда P0.

Способ генерации списка (повторять на каждом проходе):

```powershell
# файлы без прямого теста (ищет <base>.test.* рядом и в tests/):
$sources = git ls-files 'src/*' 'server/*' | Where-Object { $_ -match '\.(ts|tsx)$' -and $_ -notmatch '\.test\.|\.spec\.' }
$tests = git ls-files | Where-Object { $_ -match '\.test\.|\.spec\.' }
# (скрипт-матчинг: имя файла без расширения == имя теста без ".test"/".spec")
```

> **🔴 Критерий перехода:** список полон (все директории пройдены). Если найдена новая функция без записи в матрицу — добавить и перейти к Этапу 2.

---

## 🔄 ЭТАП 2: КАРТА ПОКРЫТИЯ

Для каждой функции из Этапа 1 в `docs/test-coverage-matrix.md` зафиксировать:

| Поле | Значение |
|------|----------|
| Путь | `src/lib/...` |
| Экспорты | функции/компоненты |
| Тесты | путь к `.test.ts(x)` / `.spec.ts` или `—` |
| Приоритет | P0 / P1 / P2 |
| Статус | ✅ покрыто / ⚠️ partial / ❌ gap |

**Приоритеты:**

| Класс | Что | Примеры |
|-------|-----|---------|
| **P0** | криптография, ключи, сессии, storage, auth, rate-limit, CSP, store-сlices, retry/ошибки, server routes | `lib/crypto/*`, `lib/identity/*`, `lib/secureStorage.ts`, `server/routes/*`, `store/slices/*` |
| **P1** | core user flows: чат, вызовы, контакты, настройки, навигация, hooks | `hooks/*`, `components/chat*`, `e2e/*` |
| **P2** | визуальные/edge: stories, pulse player, CRM-виды, ui-примитивы, mock data | `components/stories/*`, `components/crm/*`, `constants/*` |

**Правило пирамиды:**

```
unit (vitest)      — логика: crypto, slices, utils, retry, invariants
integration (vitest) — store-состав, db, routes (http-mock), hooks
e2e (playwright)   — пользовательские сценарии: от входа до действия
visual (playwright) — снимки экранов + адаптив (320px–1920px)
```

> **🔴 Критерий перехода:** в матрице нет `?` (неопознанное). Каждый `❌ gap` имеет план (тест создаётся в Этапе 3).

---

## 🔄 ЭТАП 3: ДОПИСЫВАНИЕ ТЕСТОВ

### 3.1 Порядок (сверху вниз, P0 → P2)

1. Crypto / identity / keys
2. Store slices (каждый slice: каждое поле + каждое действие)
3. Server routes + middleware (auth, rateLimit, CSP)
4. Lib-утилиты (retry, errorHandling, secureStorage, gracefulDegradation)
5. Hooks
6. Компоненты (render + interaction + empty/error states)
7. e2e user flows
8. Visual / a11y (touch ≥ 44px, zoom 200%, 320px)

### 3.2 Правила написания

- Тест рядом с модулем: `foo.ts` → `foo.test.ts` (исключение: `server/__tests__/`, `e2e/`, `tests/`).
- Имена: `it('does X when Y')` — поведение, не реализация.
- Каждый тест: **arrange → act → assert**, один assert-блок = одно поведение.
- Моки: только внешности (network, idb, crypto.getRandomValues если детерминизм нужен). Крипто **не** мокать в крипто-тестах.
- Negative cases обязательны: невалидный ввод, expired/expired-токены, битый JSON, empty state.
- **Запрещены фейковые тесты** (копия логики внутри теста, см. инцидент `server/__tests__/ads.test.ts` v1 — тестировала локальную копию, а не модуль). Тест импортирует реальную функцию.
- Таймауты: vitest — реальные (fake timers для retry/backoff), playwright — `expect.poll` для асинхронного UI.
- Конфиденциальность: в тестах — только фиктивные данные (`test-secret`, `123456`, mock users). Никаких реальных ключей/паролей.

### 3.3 Покрытие edge cases (минимум на каждый модуль P0/P1)

- Пустые данные (empty list / null / undefined)
- Длинные строки (10k символов, спецсимволы, эмодзи, RTL)
- Дубли (повторный вызов действия)
- Race (одновременные вызовы, отмена)
- Ошибки (throw внутри, network failure, timeout)
- Границы (0, 1, max-значение, overflow)

> **🔴 Критерий перехода:** все `❌ gap` P0 закрыты. P1 — ≥ 80%. Если найдён новый разрыв — исправить и вернуться к Этапу 2.

---

## 🔄 ЭТАП 4: ПОЛЬЗОВАТЕЛЬСКОЕ ПОВЕДЕНИЕ (e2e)

### 4.1 Таблица сценариев (happy path + edge)

| # | Сценарий | Вход → Действие → Результат | Статус |
|---|----------|------------------------------|--------|
| F1 | Запуск | открыть app → mock-данные видны, тема dark, нет error boundary | ✅ basic.spec |
| F2 | Навигация | 5 табов → каждый рендерится → round-trip без бага | ✅ navigation.spec |
| F3 | Чат: список | поиск, фильтры, папки, unread, archived | ✅ chat-list.spec |
| F4 | Чат: окно | история, media, voice bubbles, composer controls | ✅ chat-window.spec |
| F5 | Чат: отправить | текст → Enter/send → сообщение в истории | ✅ chat-window.spec |
| F6 | Чат: reply/edit/delete | действия из меню → результат + undo | ⚠️ partial (reply ✅, edit/delete — gap) |
| F7 | Чат: schedule/sticker/search/reactions | popup-валидация, picker, in-chat search | ✅ chat-window.spec |
| F8 | Контакты | добавление (валидация), профиль, share/scan QR, delete | ✅ contacts.spec |
| F9 | Вызовы | история, поиск, clear, добавление контакта | ✅ calls.spec |
| F10 | Настройки | все секции: appearance, language, security (PIN), privacy, network, storage, system | ✅ settings.spec |
| F11 | Компания | workspace, channels, members | ⚠️ partial (loads ✅, CRUD — gap) |
| F12 | Stories | просмотр, compose, options | ⚠️ partial (loads ✅, compose — gap) |
| F13 | Recordings | player, запись, delete | ⚠️ partial (empty state ✅, player — gap) |
| F14 | Auth (admin) | login, 2FA, rate-limit lockout, logout | ⚠️ unit ✅, e2e — gap |
| F15 | Auth (app) | login screen, registration, validation | ⚠️ screens untested (e2e gap) |
| F16 | Offline / resilience | error boundary, retry, offline banner | ✅ resilience.spec |
| F17 | Адаптив | 320px, mobile viewport, zoom 200%, touch ≥ 44px | ✅ usability.spec |
| F18 | Тема/язык | переключение dark/light, язык, font size | ✅ settings.spec |

Каждый `⚠️ partial` / `❌` — задача Этапа 3.7.

### 4.2 Правила e2e

- Локали: каждый сценарий — `test()` с именем сценария, не "check element".
- Mock-данные детерминированные (`VITE_USE_MOCK=true`).
- Каждый assert — по поведению пользователя, не по DOM-классам.
- `expect.poll` для асинхронного; `test.skip` только с комментарием + issue.
- После каждого нового spec: `npx playwright test <spec>` → зелёный.

> **🔴 Критерий перехода:** все F-сценарии ✅. Если найден сломанный сценарий — чинить код или тест, вернуться к Этапу 3.

---

## 🔄 ЭТАП 5: ПРОГОН И ФИКСЫ

```
npm test
npm run lint
npx playwright test
```

- [ ] 0 падений unit.
- [ ] 0 падений e2e (или known-flaky, задокументировано).
- [ ] 0 ошибок lint.
- [ ] Консоль приложения (dev) без новых ошибок в прогонах e2e.

**Правило фикса:** упал тест → определить: баг в тесте (фикс теста) или баг в коде (фикс кода + регрессионный тест). **Никогда** не ослаблять assert без записи причины в комментарий.

> **🔴 Критерий перехода:** три последовательных зелёных прогона. Любой красный — счётчик сбрасывается.

---

## 🔄 ЭТАП 6: КАЧЕСТВЕННЫЕ ГАЙТЫ

- [ ] `docs/test-coverage-matrix.md` актуальна (статусы обновлены прогоном).
- [ ] Новые тесты закоммичены (commit: `test: ...`, conventional).
- [ ] В `CHANGELOG.md` — строка про добавленные тесты.
- [ ] Время полного прогона ≤ 10 мин (vitest) + ≤ 10 мин (e2e). Если дольше — оптимизировать (параллелизация, mock-тяжелого).

---

## ✅ УСЛОВИЕ ЗАВЕРШЕНИЯ ЦИКЛА

Цикл завершён ТОЛЬКО когда:

1. ✅ Матрица: 0 незакрытых P0, 0 `?`.
2. ✅ Таблица F-сценариев: 0 `❌`, все `⚠️` с планом.
3. ✅ Три последовательных полных прогона (Этап 0) без падений и без новых находок.

**Счётчик сброса:** любая новая находка (упавший тест, новый gap, новый файл без записи) → счётчик = 0.

---

## 🚫 АНТИПАТТЕРНЫ

| Антипаттерн | Почему |
|-------------|--------|
| Тест, копирующий логику (не импортирует модуль) | Проверяет воздух, не код (инцидент: ads.test.ts v1) |
| `expect(true).toBe(true)` / пустые тесты | Мертвый код |
| Ослабленный assert без комментария | Прячет регресс |
| Скрывание `test.skip` без причины | Потеря покрытия |
| Моки крипто-функций в крипто-тестах | Не проверяет реальность |
| Тесты с реальными секретами | Утечка в репо |
| Один огромный тест на всё | Неясный виновник при падении |

---

## 📊 ЧЕК-ЛИСТ ПРОХОДА

```
□ Этап 0  — baseline зелёный
□ Этап 1  — инвентарь полон
□ Этап 2  — матрица актуальна, без "?"
□ Этап 3  — P0 gaps = 0, P1 ≥ 80%
□ Этап 4  — F-сценарии ✅
□ Этап 5  — 3 зелёных прогона
□ Этап 6  — матрица/CHANGELOG обновлены
→ счётчик +1 (нужно 3 подряд)
```
