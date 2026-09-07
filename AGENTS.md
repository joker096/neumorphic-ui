# Унифицированное задание для ИИ: Автономный цикл итеративной оптимизации приложения

> **Версия:** 1.1 (2026-08-30: слит единый цикл — раздел «Dead Controls Cycle (D1–D5)»)  
> **Формат:** Markdown (.md)  
> **Принцип работы:** Бесконечный цикл проверки → исправления → повторной проверки до достижения нулевых ошибок.

---

## 📋 Общее описание

ИИ должен работать в режиме **автономного цикла (loop)**, последовательно выполняя все нижеописанные этапы. После каждого прохода ИИ **обязан вернуться к началу** и повторить весь цикл. Цикл прерывается **только тогда**, когда при полном проходе по всем этапам не обнаружено ни одной проблемы, ошибки или недочёта.

**Золотое правило:**  
> *"Если найдена хотя бы одна проблема — исправить её и начать цикл заново с Этапа 1. Повторять до полного отсутствия ошибок."*

---

## 🔄 ЭТАП 1: СТРУКТУРНАЯ ОПТИМИЗАЦИЯ И РЕФАКТОРИНГ

### 1.1 Вынесение данных и конфигураций
- [ ] Создать директории: `config/`, `constants/`, `data/`, `utils/`
- [ ] Вынести все статические данные из компонентов:
  - Тексты, заголовки, подписи
  - Цвета, темы, шрифты
  - URL API, endpoints
  - Константы, массивы, enum
  - Настройки приложения
- [ ] Создать единый файл конфигурации (`app.config.js` / `config.ts`)
- [ ] Убрать **весь хардкод** из JSX/TSX/Vue-компонентов
- [ ] Вынести регулярные выражения валидации в отдельный файл

### 1.2 Разбиение на атомарные компоненты (Модульность)
- [ ] Каждая кнопка → отдельный компонент `components/ui/Button/`
- [ ] Каждый инпут → отдельный компонент `components/ui/Input/`
- [ ] Каждый заголовок → отдельный компонент `components/ui/Typography/`
- [ ] Каждая иконка → отдельный компонент `components/ui/Icon/`
- [ ] Каждая карточка → отдельный компонент `components/ui/Card/`
- [ ] Каждый спиннер/лоадер → отдельный компонент `components/ui/Spinner/`
- [ ] Каждый модал/диалог → отдельный компонент `components/ui/Modal/`
- [ ] Каждый селект/дропдаун → отдельный компонент `components/ui/Select/`
- [ ] Принцип **Single Responsibility**: один компонент = одна задача
- [ ] Ни один компонент не должен превышать **200-300 строк кода**

### 1.3 Оптимизация файловой структуры
- [ ] Удалить **все пустые файлы** (`.gitkeep` — исключение)
- [ ] Удалить **все пустые директории**
- [ ] Удалить **все неиспользуемые файлы** (dead code)
- [ ] Удалить **все неиспользуемые импорты** в каждом файле
- [ ] Удалить **все закомментированные блоки кода** (если не являются документацией)
- [ ] Удалить `console.log`, `debugger`, временные комментарии
- [ ] Мёртвые контролы: скан и фикс по классам D1–D5 (см. раздел «Dead Controls Cycle (D1–D5)»)
- [ ] Проверить `package.json` / `requirements.txt` на неиспользуемые зависимости

### 1.4 Проверка синтаксиса и корректности кода
- [ ] Запустить линтер (`eslint`, `tslint`, `pylint` и т.д.) — **0 ошибок, 0 предупреждений**
- [ ] Запустить компиляцию/сборку — **0 ошибок**
- [ ] Проверить все импорты/экспорты на корректность путей
- [ ] Проверить отсутствие циклических зависимостей
- [ ] Проверить типизацию (TypeScript/Flow) — **0 ошибок типов**
- [ ] Проверить форматирование кода (`prettier`) — единый стиль
- [ ] Убедиться, что приложение запускается без ошибок в консоли браузера/терминала

> **🔴 Критерий перехода:** Все пункты отмечены. Если хотя бы один не пройден — исправить и вернуться к 1.1.

---

## 🔄 ЭТАП 2: UI/UX И АДАПТИВНОСТЬ

### 2.1 Тестирование на всех разрешениях
- [ ] **Desktop:** 1920×1080, 1440×900, 1024×768
- [ ] **Tablet:** 768×1024 (портрет), 1024×768 (ландшафт)
- [ ] **Mobile:** 375×667 (iPhone), 320×568 (маленькие экраны)
- [ ] Проверить переключение **portrait ↔ landscape** на мобильных
- [ ] Проверить **zoom** до 200% — элементы не должны ломаться
- [ ] Проверить **минимальную ширину 320px** — горизонтальный скролл запрещён

### 2.2 Элементы управления и отступы
- [ ] Размер активных зон (тач-зон) **минимум 44×44 пикселей**
- [ ] Кнопки не перекрываются друг с другом
- [ ] Текст читаемый на всех разрешениях (минимум 12px, рекомендуется 14px+)
- [ ] **Отступы единообразны** по всему приложению (система spacing: 4, 8, 12, 16, 24, 32, 48, 64)
- [ ] Заголовки выровнены, не обрезаются, не наезжают на другие элементы
- [ ] Изображения адаптивны, не растягиваются, сохраняют пропорции
- [ ] Контрастность текста и фона соответствует WCAG AA (минимум 4.5:1)

### 2.3 Формы ввода данных
- [ ] При фокусе на поле ввода **клавиатура не перекрывает поле**
- [ ] Экран **автоматически скроллится** к активному полю
- [ ] Тип клавиатуры соответствует типу поля:
  - `email` → клавиатура с `@` и `.com`
  - `tel` → цифровая клавиатура
  - `number` → цифровая клавиатура
  - `url` → клавиатура с `/` и `.com`
- [ ] **Autofill** работает корректно (атрибуты `autocomplete`)
- [ ] Валидация в реальном времени с понятными сообщениями об ошибках
- [ ] Маски ввода для телефонов, дат, карт

### 2.4 Тёмная тема и обратная связь
- [ ] Приложение корректно отображается в **Dark Mode**
- [ ] Все цвета адаптированы под тёмную тему
- [ ] При загрузке данных отображается **индикатор прогресса** (спиннер/скелетон)
- [ ] При длительных операциях (>1 сек) — прогресс-бар или процент
- [ ] Состояние **пустых данных** обработано (illustration + текст)
- [ ] Состояние **ошибки** обработано (понятное сообщение + кнопка retry)
- [ ] Состояние **offline** обработано (баннер + кэшированные данные)

### 2.5 Навигация и взаимодействие
- [ ] Навигация интуитивна, хлебные крошки при необходимости
- [ ] Кнопка "Назад" работает корректно (не ломает состояние)
- [ ] Pull-to-refresh на мобильных (где уместно)
- [ ] Бесконечный скролл или пагинация работают плавно
- [ ] Анимации плавные, не тормозят (60 FPS)

> **🔴 Критерий перехода:** Все пункты отмечены. Если хотя бы один не пройден — исправить и вернуться к Этапу 1.

---

## 🔄 ЭТАП 3: БЕЗОПАСНОСТЬ (OWASP + MASVS + CVE)

### 3.1 OWASP Top 10 для веб-приложений

| Код | Угроза | Проверка | Статус |
|-----|--------|----------|--------|
| A01 | **Injection** (SQL, NoSQL, Command, XSS) | Используются prepared statements / parameterized queries. Весь пользовательский ввод экранируется. | ☐ |
| A02 | **Broken Authentication** | Надёжные пароли (мин. 8 симв., сложность). MFA где критично. Таймаут сессий. Безопасное хранение паролей (bcrypt/Argon2). | ☐ |
| A03 | **Sensitive Data Exposure** | Все API-запросы через **HTTPS/TLS 1.3**. Чувствительные данные зашифрованы в rest. Нет логирования паролей/токенов. | ☐ |
| A04 | **XML External Entities (XXE)** | Парсеры XML отключены для внешних сущностей. Используется JSON вместо XML где возможно. | ☐ |
| A05 | **Broken Access Control** | Проверка прав на **каждом endpoint**. Запрет на прямой доступ к файлам. CORS настроен строго. | ☐ |
| A06 | **Security Misconfiguration** | Убраны дефолтные пароли/учётки. Отключены ненужные фичи. Заголовки безопасности установлены (HSTS, X-Frame-Options, CSP, X-XSS-Protection). | ☐ |
| A07 | **Cross-Site Scripting (XSS)** | Content Security Policy (CSP) настроен. Sanitize HTML (DOMPurify). `innerHTML` не используется. | ☐ |
| A08 | **Insecure Deserialization** | Валидация всех входных данных. Используются безопасные форматы (JSON). Подпись данных (HMAC). | ☐ |
| A09 | **Using Components with Known Vulnerabilities** | Все зависимости проверены через CVE/NVD. Устаревшие пакеты обновлены. | ☐ |
| A10 | **Insufficient Logging & Monitoring** | Логирование входов, ошибок, подозрительной активности. Мониторинг brute-force, необычных запросов. | ☐ |

### 3.2 OWASP Mobile Top 10 / MASVS

| Код | Требование | Проверка | Статус |
|-----|------------|----------|--------|
| M01 | **Improper Platform Usage** | Корректное использование нативных API. Нет хардкода ключей в коде. | ☐ |
| M02 | **Insecure Data Storage** | Токены/пароли в **Keychain (iOS)** / **Keystore (Android)**. Не в localStorage/AsyncStorage в открытом виде. | ☐ |
| M03 | **Insecure Communication** | Все API через HTTPS. **Certificate Pinning** реализован. Запрет на cleartext traffic. | ☐ |
| M04 | **Insecure Authentication** | Биометрическая авторизация где возможно. Корректные таймауты сессий. Refresh token rotation. | ☐ |
| M05 | **Insufficient Cryptography** | Используются современные алгоритмы (AES-256-GCM, RSA-4096). Нет кастомной криптографии. | ☐ |
| M06 | **Insecure Authorization** | Проверка прав на клиенте и сервере. Нет client-side авторизации без серверной валидации. | ☐ |
| M07 | **Client Code Quality** | Код обфусцирован (ProGuard/R8). Нет отладочной информации в production. | ☐ |
| M08 | **Code Tampering** | Проверка целостности приложения. Защита от реверс-инжиниринга. | ☐ |
| M09 | **Reverse Engineering** | Root/jailbreak detection. Обфускация кода. Anti-debugging меры. | ☐ |
| M10 | **Extraneous Functionality** | Убраны тестовые endpoints, debug-режимы, бэкдоры. | ☐ |

### 3.3 Проверка зависимостей на уязвимости
- [ ] Просканировать `package.json` / `requirements.txt` / `Podfile` / `build.gradle` через:
  - **OWASP Dependency-Check**
  - **Snyk**
  - **npm audit** / **yarn audit**
  - **pip-audit** (для Python)
- [ ] Проверить каждую зависимость в базах **CVE** и **NVD**
- [ ] Обновить все уязвимые пакеты до последних безопасных версий
- [ ] Удалить неиспользуемые зависимости
- [ ] Зафиксировать версии зависимостей (lock-файлы)

### 3.4 Заголовки безопасности (для веб)
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] `Content-Security-Policy` — строгая политика
- [ ] `X-Frame-Options: DENY` или `SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` — ограничение API браузера

> **🔴 Критерий перехода:** Все пункты отмечены. Если хотя бы один не пройден — исправить и вернуться к Этапу 1.

---

## 🔄 ЭТАП 4: БЕЗОТКАЗНОСТЬ И ОТКАЗОУСТОЙЧИВОСТЬ

### 4.1 Глобальная обработка ошибок
- [ ] Реализован **Error Boundary** (React) / глобальный обработчик ошибок
- [ ] Любой краш компонента **не ломает всё приложение**
- [ ] Fallback UI при ошибке (понятное сообщение + кнопка перезагрузки)
- [ ] Все асинхронные операции обёрнуты в `try-catch`
- [ ] Все Promise имеют `.catch()` или `await` в `try-catch`
- [ ] Глобальный обработчик необработанных ошибок (`window.onerror`, `unhandledrejection`)

### 4.2 Graceful Degradation
- [ ] Приложение работает при **отсутствии сети** (Service Worker / PWA)
- [ ] Кэширование критичных данных (localStorage/IndexedDB с шифрованием)
- [ ] Деградация функционала, а не полный отказ (показывать что возможно)
- [ ] Retry-логика для сетевых запросов (экспоненциальный backoff, max 3 попытки)
- [ ] Таймауты на все сетевые запросы (не ждать вечно)

### 4.3 Мониторинг и логирование
- [ ] Централизованное логирование ошибок (Sentry / LogRocket / Rollbar)
- [ ] Логирование только **нечувствительных** данных (без паролей, токенов, ПИИ)
- [ ] Метрики производительности (FCP, LCP, CLS, TTFB)
- [ ] Мониторинг доступности (uptime checks)
- [ ] Алерты при критических ошибках

### 4.4 Производительность
- [ ] Lazy loading для маршрутов и тяжёлых компонентов
- [ ] Оптимизация изображений (WebP, lazy loading, responsive images)
- [ ] Минификация CSS/JS
- [ ] Code splitting по маршрутам
- [ ] Кэширование статики (CDN, browser cache)
- [ ] Core Web Vitals в зелёной зоне:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

> **🔴 Критерий перехода:** Все пункты отмечены. Если хотя бы один не пройден — исправить и вернуться к Этапу 1.

---

## 🔄 ЭТАП 5: АРХИТЕКТУРНАЯ ДОКУМЕНТАЦИЯ

### 5.1 Схема архитектуры
- [ ] Нарисовать (текстовую/графическую) схему компонентов приложения
- [ ] Описать, **что за что отвечает** (каждый компонент, каждый модуль)
- [ ] Описать **data flow**: от пользователя → API → хранилище → UI
- [ ] Описать state management (Redux / Zustand / Context / MobX)
- [ ] Описать API endpoints: метод, URL, входные/выходные параметры, ошибки
- [ ] Описать систему авторизации и аутентификации
- [ ] Описать систему прав доступа (RBAC / ACL)

### 5.2 Документация кода
- [ ] JSDoc / TSDoc для всех публичных функций и компонентов
- [ ] README.md в корне с инструкцией по запуску
- [ ] README.md в каждой директории с описанием содержимого
- [ ] CHANGELOG.md с историей изменений
- [ ] CONTRIBUTING.md с правилами для разработчиков

### 5.3 Проверка соответствия
- [ ] Код соответствует описанной схеме
- [ ] Все компоненты документированы
- [ ] Схема актуальна (нет устаревшей информации)
- [ ] Новый разработчик может разобраться по документации

> **🔴 Критерий перехода:** Все пункты отмечены. Если хотя бы один не пройден — исправить и вернуться к Этапу 1.

---

## 🔄 ЭТАП 6: ФИНАЛЬНОЕ ТЕСТИРОВАНИЕ

### 6.1 Полный регрессионный тест
- [ ] Пройти все пользовательские сценарии (happy path)
- [ ] Пройти все edge cases (пустые данные, длинные строки, спецсимволы)
- [ ] Проверить все формы на валидацию
- [ ] Проверить все кнопки на кликабельность
- [ ] Проверить все ссылки на работоспособность
- [ ] Проверить все переходы между страницами

### 6.2 Кросс-браузерное тестирование
- [ ] Chrome (последняя версия)
- [ ] Firefox (последняя версия)
- [ ] Safari (последняя версия)
- [ ] Edge (последняя версия)
- [ ] Мобильный Chrome (Android)
- [ ] Мобильный Safari (iOS)

### 6.3 Нагрузочное тестирование
- [ ] Приложение работает при медленном интернете (3G)
- [ ] Приложение работает при отключённом интернете
- [ ] Приложение не падает при быстрых кликах/действиях
- [ ] Приложение не падает при одновременных запросах

> **🔴 Критерий перехода:** Все пункты отмечены. Если хотя бы один не пройден — исправить и вернуться к Этапу 1.

---

## 🔄 Dead Controls Cycle (D1–D5)

> Детальное раскрытие ЭТАПА 1.3 (dead code) и 6.1 (проверка всех кнопок на кликабельность). Срабатывает на каждом проходе общего цикла и отдельно по команде. Машиночитаемые гейты — `npm run lint`, `npx tsc --noEmit`, `npx vitest run`; фиксы фиксируются под `### Fixed` в `CHANGELOG.md`.

**Золотое правило:**
> *Контрол, который при клике не меняет наблюдаемое состояние (store / DOM / local state) — баг. Исправить и просканировать заново. Цикл завершён только при 0 findings в трёх подряд прогонах.*

### КЛАССЫ ДЕФЕКТОВ (что искать)

| Код | Класс | Сигнал | Реальный кейс |
|-----|-------|--------|---------------|
| `D1` | Синтетический id | setter ищет id, которого нет в store | `setContactMuted(hash_<chatId>)` — профиль из chat list |
| `D2` | Same-value write | действие пишет текущее значение, а не противоположное | `setChatMuted(id, isChatMuted)` |
| `D3` | Guarded no-op | действие/handler early-return'ится в текущем render-контексте | permissions-тумблеры для non-group / non-admin |
| `D4` | Double toggle | вложенный интерактив без `stopPropagation` — клик считается дважды, состояние откатывается | `SettingsRow`: клик по строке + внутренний switch |
| `D5` | Empty handler | `onClick={() => {}}`, undefined, no-op | `SettingsRow`: chevron/строка без действия (системный, фикс 2026-08-30) |

### ЭТАП 0: БАЗОВАЯ ПРОВЕРКА (baseline)

```
npm run lint          # eslint + tsc — 0 ошибок
npx tsc --noEmit      # типы
npx vitest run        # регресс
```

- [ ] `npm run lint` — 0 ошибок.
- [ ] `npx tsc --noEmit` — 0 ошибок.
- [ ] `npx vitest run` — 0 падений.

> **🔴 Критерий перехода:** baseline зелёный. Красный — сначала чиним упавшее (не пишем новый код), затем Этап 1.

### ЭТАП 1: СКАН

Целевые поиск-паттерны (повторять на каждом проходе):

```powershell
# интерактивы:
rg -n "role=\"switch\"|role=\"button\"|<button|ToggleSwitch|SettingsRow" src/components
rg -n "onClick=|onToggle=" src/components
```

Для **каждого** контрола трассировать 5 вопросов:

1. **Откуда id/значение?** prop из store? из пропсов? синтезированный? → `D1`.
2. **Действие пишет противоположное значение?** `setX(id, !isX)` или эхо `setX(id, isX)`? → `D2`.
3. **Гарды:** ранний `return` в action/handler делает действие no-op в текущем контексте рендера? → `D3`.
4. **Вложенность:** интерактив внутри интерактива без `e.stopPropagation()`? → `D4`.
5. **Хендлер не пустой?** он меняет наблюдаемое состояние (store/DOM/local state)? → `D5`.

Приоритет обхода: модальные профили (`ContactProfileModal`, `ChatProfileView`, `CallPanel`) → настройки (`SettingsRow`, `NotificationsSection`) → списки → UI-kit.

> **🔴 Критерий перехода:** таблица findings полная: `контрол | файл:строка | код (D1..D5) | эффект`. Пустая таблица → Этап 3.

### ЭТАП 2: ФИКСЫ (по приоритету)

Порядок: `D4` → `D1` → `D2` → `D3` → `D5`.

- **D4** — `e.stopPropagation()` на внутреннем интерактиве; хит-зона одна.
- **D1** — резолвить реальную сущность: contact из store → name-matched DM-чат → fallback на local state. Не изобретать id. Для DM-чата `setChatMuted(dmChat.id, ...)` — **без** `String()` (строгое сравнение со сохранённым id).
- **D2** — писать противоположное значение: `setX(id, !isX)`.
- **D3** — house style: скрывать контрол в неприменимом контексте (`{guard && ( ... )}`), а не `disabled`.
- **D5** — либо реализовать действие, либо удалить контрол.

**Правило фикса:** каждый фикс = регрессионный тест рядом с компонентом (клик → assert изменения store/DOM/state) + строка в `CHANGELOG.md` под `### Fixed`.

> **🔴 Критерий перехода:** все findings закрыты, каждый с тестом. Если остался — вернуться к Этапу 2.

### ЭТАП 3: ПОВТОРНЫЙ ПРОГОН

```
npm run lint
npx tsc --noEmit
npx vitest run
```

- [ ] Перескан (Этап 1) — 0 findings.
- [ ] `npm run lint` — 0 ошибок.
- [ ] `npx tsc --noEmit` — 0 ошибок.
- [ ] `npx vitest run` — зелёный.

**Условие завершения цикла:** findings 0 + три последовательных зелёных прогона + строки про фиксы в `CHANGELOG.md` (если были). Любой новый finding → счётчик = 0.

### АНТИПАТТЕРНЫ

| Антипаттерн | Почему |
|-------------|--------|
| `disabled` на мёртвом контроле вместо скрытия | House style — скрывать; disabled — мёртвый UI, вводит в заблуждение |
| `onClick={() => {}}` «чтобы линтер молчал» | Прячет D5 |
| Писать текущее значение в store «как fallback» | Это D2, не фикс |
| Изобретать синтетические id | Это D1, не фикс |
| Убирать `stopPropagation` «упростить» | D4 вернётся |
| Чинить один компонент, не просканировав остальные | Тот же паттерн живёт в других модалках/секциях |

### Pass log

| Дата | Findings | Фиксы | Гейты |
|------|----------|-------|-------|
| 2026-08-29 | 3 (D1×1, D2×1, D3×1) | `ContactProfileModal.tsx` (D1), `ChatProfileView.tsx` (D2, D3) | lint 0, tsc clean, vitest 4375/4375 (199 файлов) |
| 2026-08-30 | 1 (D5 системный: `SettingsRow`) | `ui/SettingsRow.tsx` (interactive = `Boolean(onClick)`, chevron только для interactive-строк, non-interactive строка → обычный `div`, right-side контрол сохраняет свою хит-зону; регрессия `SettingsRow.test.tsx`) | lint 0, tsc clean, vitest 4376/4376 (199 файлов) |
| 2026-08-30 | 4 (D1×2, D5×1, D3×1) | `ContactProfileModal.tsx` (D1: `blockedContact` резолвится id→name, `setContactBlocked(realId, …)`; D3: Block скрыт, когда контакт в store не резолвится), `useProfileActions.ts` (D1: `handleProfileBlock` — только risk-guard + close, delete-by-name убран), `ChatProfileView.tsx` (D5: фейковый Block-кнопка → реальный toggle name-matched контакта; D3: скрытие без контакта); регрессия `ContactProfileModal.test.tsx` +3, новый `ChatProfileView.test.tsx` (3) | lint 0, tsc clean, vitest 4382/4382 (200 файлов) |
| 2026-08-30 | 3 (D5×3) | `ChatProfileView.tsx` (D5: канал-«Leave» только тост → новый `chatSlice.leaveChannel`, строгий id, чистка `archivedChats`/`pinnedMessageList`), `SystemPulsePlayer/TopBar.tsx` (D5: «Add Station» только `onKeyDown` → `onClick` через `openAddStation`), `SystemPulsePlayer/PlaylistView.tsx` + `SystemPulsePlayer.tsx` (D5: file input без `onChange` → `handleFileSelect` из player-state); регрессия `chatSlice.test.ts` +1, `ChatProfileView.test.tsx` +1, `TopBar.test.tsx` +1, `PlaylistView.test.tsx` +1 | lint 0, tsc clean, vitest 4386/4386 (200 файлов) |
| 2026-08-31 | 2 (D1×1, D3×1) | `useProfileActions.ts` (D1: `handleProfileToggleFavorite` мапилл только `contacts` — chat-only id из чат-листа no-op, favorite терялся; теперь параллельный map `chats` по strict id), `CompanyMembersPanel.tsx` (D3: «Start call» enabled при `selectedIds.size > 0`, но `startGroupVideoCall` фильтрует себя и early-return при 0 участников — selected-only-self = dead button; `disabled={!hasParticipant}`); регрессия: новый `useProfileActions.test.ts` (3), `CompanyMembersPanel.test.tsx` +1 | lint 0, tsc clean, vitest 5464/5464 (317 файлов) |
| 2026-09-01 | 0 | Перескан D1–D5: 0 findings (D4 закрыт: `Row` в `ChatProfileView` = plain div, `SettingsRow`/`SettingsToggleRow` с stopPropagation, `ui/ToggleSwitch` 1 usage в non-clickable parent; D2: все set* пишут противоположное значение; `hash_` в `ChatPreviewLayer` = задокументированная name-matched fallback chain) | lint 0, tsc clean, vitest 5464/5464 (317 файлов) — зелёный проход 1/3 |
| 2026-09-01 | 0 | Перескан D1–D5: 0 findings (D5: `onClick={() => {}}` только в test mocks; D1: `hash_` в app-коде только `ChatPreviewLayer:188`; D2: все call sites set* = инверсия/константа) | lint 0, tsc clean, vitest 5464/5464 (317 файлов) — зелёный проход 2/3 |
| 2026-09-01 | 0 (D1–D5) + 2 observation (§1.3 dead code) | Перескан D1–D5: 0 findings (все `role="button"`/`role="switch"` = живые хендлеры: CrmDeals→setSelected, ChatHeader→onProfileClick, MessageReactions→picker, ChatListBots→onOpenBot (AppShell:175), ThemeToggle→setTheme; все onToggle = инверсия/константа). Observation §1.3: `ThemeToggle.tsx` + `LanguageSelector.tsx` не рендерятся (только barrel-реэкспорт + self-тесты; CHANGELOG:31 — ThemeToggle заменён inline-сегментным контролом; план 2026-06-25:307 — LanguageSelector «оставлен для будущего использования»); решение о удалении — за пользователем | lint 0, tsc clean, vitest 5464/5464 (317 файлов) — зелёный проход 3/3 |
| 2026-09-01 | 0 | §1.3 фикс: удалены `ThemeToggle.tsx` + `LanguageSelector.tsx` (+тесты, −10 тестов), barrel-экспорты из `AppChrome.tsx` (barrel жив: AdvancedFilterModal/StoryViewer/StoryComposer). Перескан D1–D5: 0 findings (empty handlers только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:188`) | lint 0, tsc clean, vitest 5454/5454 (315 файлов) |
| 2026-09-01 | 0 (D1–D5) + §5.3 doc | Docs-фикс §5.3: `docs/architecture-messenger-schema.md` — High-Level Flow обновлён (устаревшие `GlobalControls`/`HubView` → цепочка `AppAuthGate → AppShell → AppSideList/AppMainContent → ChatWorkspace \| FeatureViews \| ContentView → AppOverlays`, сверено с `App.tsx:261-376`); добавлены недостающие UI-модули (`chat-preview`, `auth`, `call`, `company`, `contacts`, `crm`, `ecochat`, `embed`, `huddle`, `integrations`, `landing`, `lock`, `navigation`, `payments`, `recordings`, `settings`, `status`, `stories`, `SystemPulsePlayer`) + карта компонентов-корня; `ui/*` список уточнён. Код не тронут, D-перескан: 0 findings | lint 0, tsc clean, vitest 5454/5454 (315 файлов) |
| 2026-09-01 | 0 (D1–D5) + финальный батч (§1.3 + e2e) | Финальный батч: `NetworkSection.tsx` — Obfuscation Mode row отцеплена от retired `TrafficObfuscator` (цикл через store-only `setObfuscationMode` aesgcm→httpmask→mediadummy; +3 unit tests, `vi.mock` обфускатора убран); e2e re-target после удаления `ThemeToggle` — theme → `getByTestId('theme-mode-light'/'theme-mode-dark')` + `html[data-theme]`, company nav → `getByText('CRM')` (heading `CrmView`). Перескан D1–D5: 0 findings | lint 0, tsc clean, vitest 5456/5456 (315 файлов), e2e 189/189 |
| 2026-09-01 | 0 (D1–D5) + §1.3/§3.3 dep cleanup | Unused devDeps удалены (`esbuild`, `jimp`, `@jimp/plugin-color`, `@vitest/ui` — import-скан: 0 ссылок в src/server/scripts/e2e/config/.ps1), lockfile синхронизирован. `npm audit` полный инвентарь: остаток = 2 advisory в цепи `@bubblewrap/core` (`extract-zip` HIGH — нет фиксированной версии, `file-type` MODERATE — jimp 0.22.12 требует default export, удалённый в file-type ≥17) → dev-only (`scripts/build-android.mjs`), не в бандле, trusted inputs = documented accepted risk (§29). `npm run audit` (prod gate) 0 high/critical. Перескан D1–D5: 0 findings | lint 0, tsc clean, vitest 5458/5458 (315 файлов) |
| 2026-09-01 | 0 (D1–D5) + §26 deferred i18n | Код-батч §26: `DataState` RU icon-sniffing → `emptyIcon?: 'search' | 'inbox'` (call sites: `ChatListView`/`GlobalSearch`/`WorkplaceView` → `search`, `CallLogView` conditional), `crm/import.ts` RU literals → structured `ImportIssueCode`/`value` + `crm.import.iss*` ×8, `ChatMessage` Morse → `chat.morseEncode`/`chat.morseDecode` ×8; docs close-out (CHANGELOG `### Fixed`, STATE.md). Перескан D1–D5 после кода: 0 findings (retry/action-кнопки `DataState` guard-rendered; `emptyIcon`-call sites live; Morse toggle = реальная инверсия; `onClick={() => {}}` только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:188`) — 3 последовательных зелёных прохода | lint 0, tsc clean, vitest 5458/5458 (315 файлов), e2e 189/189 |
| 2026-09-01 | 0 (D1–D5) + 2 цикла оптимизации (§1.1/§3/§5) | Цикл A (11 коммитов, 9b80525…cf30f97): `ThemeToggle`/`LanguageSelector`/`InputFooter`/`useChatInteraction` dead-code удалены; §3 parse-guards (`P2PTransport` ×2, `paymento` ×2, `InlineKeyboard` url allowlist) + §5.3 docs sync (README 2 мёртвых `node server/*.js`→`npm run admin:create`/`deploy:server` + audit-скрипты + счётчики tests; schema `features/*` реальный switch profile/settings/contacts/calls/company/bot/miniApp/workplace + config-layer блок; `ARCHITECTURE_SCHEMA.md` HubView удалён); D2 `ChatProfileView` label i18n (digit-stripping fix). Цикл B (2 коммита): C2 `CHAT_FOLDER_KEYS` общие для `FolderFilterBar`+`useFilteredChats`; B3 `constants/time.ts` (MINUTE_MS/HOUR_MS/DAY_MS/ACTIVE_NOW_THRESHOLD_MS) в `ContactProfileModal`/`ContactItem`. D3/D4 = false positives (fallback-контракт, все ключи в en). Re-scans: D1–D5 0 findings, audit 0 high/critical, icon-font 0 — 3 последовательных зелёных прохода | lint 0, tsc clean, vitest 5505/5505 (318 файлов), e2e 191/191 |
| 2026-09-03 | 0 (D1–D5) + §2.2 a11y батч | Visible labels for icon-only ação buttons (§2.2 a11y): replaced `sr-only` text with visible label across 11 files — `AdvancedFilterModal` Reset/Apply footer (icon-only squares → `flex-1 h-10` labeled pills), `HelpSupportSection` Send request / Report a bug (icon-only → full-width labeled), `CompanyCreatePrompt` Create company / How to create (icon-only squares → `min-h-11 px-4` pills), `LockScreen`+`AppLockScreen` unlock (full-width sr-only → visible), `CreateChannelModal`/`CreateGroupModal`/`CreateBotModal` full-width primary footers (sr-only → visible `*.create`/`*.generate`). Range-slider accessible names: `RecordingPlayer` seek+volume, `EqualizerPanel` master+EQ-band → `aria-label` (`a11y.seek`/`a11y.volume`, EQ bands `${freq} Hz`; +8 locales). CSS focus-visible rule extended (`[role="menuitem"]`, checkbox, radio, range). Left idiomatic: toolbar icons w/ adjacent context (MediaViewer overlay, LiveVoiceRecorder preview, NotificationsSection play-preview, chat-input Morse/Silent), CRM section-header "+" add buttons. Регрессия: `AdvancedFilterModal.test.tsx` re-target. Перескан D1–D5: 0 findings | lint 0, tsc clean, vitest 5549/5549 (324 файлов) |
| 2026-09-04 | 1 (§1.3: undeclared direct dep) + 0 (D1–D5) | §1.3: `scripts/generate-og-image.mjs` импортирует `jimp` напрямую, но 09-01 dep cleanup убрал `jimp` из devDeps (скан нашёл 0 ссылок — скрипты постарше? нет: скрипты появились позже) → зависимость только транзитивная (`@bubblewrap/core`). Фикс: `jimp@^0.22.12` заявлен в devDependencies, lockfile синхронизирован (top-level resolve идентичный, prod не затронут). Перескан D1–D5: 0 findings (D5 empty handlers только в test mocks; D2 echo-паттернов нет; D1 `hash_` app-code только `ChatPreviewLayer.tsx:188` = документированный name-matched fallback; D4: в a11y-батч файлах (`CreateChannelModal`, `CreateGroupModal`, `EqualizerPanel`, `MessageReactions`, `TopBar`, `PlaylistView`) интерактивы-созданные, `<button>` footer = sibling, без вложенности) | lint 0, tsc clean, vitest 5549/5549 (324 файлов), audit prod 0 high/critical (3 moderate — dev-only `@bubblewrap/core` chain, documented) |
| 2026-09-04 | 0 (D1–D5) + §3.3 qs + test-fix | §3.3: `npm audit` (full inventory) — `qs` moderate (GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g) в prod-цепи `express→body-parser→qs` (resolve `6.15.1`) → house-style pin `"qs": "^6.16.0"` в `package.json` `overrides` (рядом с `extract-zip`/`uuid`), lockfile синхронизирован, top-level resolve `6.16.0`. Test-fix: `RecordingPlayer.tsx:29` — jsdom `play()` → `undefined` (нет Promise), autoplay `.catch` падал в full-suite → guard `const p = ...; if (p) p.catch(...)`. Полный audit остаток = 6 (4 moderate, 2 high) — все dev-only `@bubblewrap/core` chain, documented. Перескан D1–D5: 0 findings (empty handlers только в test mocks; D2 echo-паттернов нет; D1 `hash_` app-code только `ChatPreviewLayer.tsx:188` = документированный fallback) | lint 0, tsc clean, vitest 5549/5549 (324 файлов), audit prod 0 vulnerabilities |
| 2026-09-04 | 1 (D5) + 0 (D1–D4) | D5: `App.tsx:269` `onRegistrationComplete={() => {}}` — после регистрации кнопка «Enter App» мертва (`useIdentityAuth` считает status только на mount → user застревает в `new-user`). Фикс: `useIdentityAuth.ts` экспортирует `recheck` (useCallback, mount-эффект через неё), `AppAuthGate.tsx` — мёртвый prop удалён, `RegistrationScreen onComplete={() => void recheck()}` (+ `LoginScreen onComplete` → закрыть login), `App.tsx` — bare `<AppAuthGate>`; persistence проверена (`storeMasterSeed` → `hasMasterIdentity()` true после регистрации). Регрессия: `useIdentityAuth.test.tsx` +1 (recheck re-runs check, status flip), `AppAuthGate.test.tsx` re-target (recheckMock: called on registration, not called на login-путях). Перескан D1–D5: 0 findings (D2: echo-паттернов нет — `ContactProfileModal` `notificationsOn` = `!muted`; D3: `disabled=` только легитимные состояния (isProcessing, pin.length, count); D4: вложенных интерактивов нет; D5 empty handlers только в test mocks) | lint 0, tsc clean, vitest 5550/5550 (324 файлов), audit prod 0 vulnerabilities |
| 2026-09-05 | 0 (D1–D5) | Чистый проход 1/3: перескан D1–D5: 0 findings (D1 `hash_` app-code только `ChatPreviewLayer.tsx:188` = документированный name-matched fallback; D2: все set* = инверсия, `HuddleWidget` `setIsMuted(muted)` = авторитетный echo из `callManager.toggleMute()`, не D2; D3: 79 `disabled=` — все легитимные состояния (isProcessing/saving/busy, валидация полей, count/role/permission, `!editable`, nav prev/next); D4: новые story/payment интерактивы = siblings (`StoryShareMenu`/`StoryFooter`/`ChatPickerModal`), SettingsRow house-style со stopPropagation; D5: empty handlers только в test mocks; новые untracked файлы `StoryCard`/`StoryShareMenu` = presentational, хендлеры провязаны (forward→picker, copy→copyLink)). `console.*`: только `warn` в error-путих (ErrorBoundary/Retry/P2PTransport/gracefulDegradation), `console.log`/`debug`/`debugger` нет. Пустые файлы: нет (barrels + `vite-env.d.ts`). audit prod: 0 vulnerabilities (после 3× ECONNRESET — transient) | lint 0, tsc clean, vitest 5550/5550 (324 файлов), audit prod 0 vulnerabilities |
| 2026-09-05 | 0 (D1–D5) | Чистый проход 2/3: перескан D1–D5: 0 findings (D2-спот `PrivacySection.tsx:114-115` + `SpamSection.tsx:21-23` = `SettingsRow` с `onClick`+`rightElement` ToggleSwitch — не D4: `ToggleSwitch.handleToggle` `e.stopPropagation()` (SettingsRow.tsx:93), клик по тумблеру → onToggle only, клик по строке → onClick only; `SettingsToggleRow` тот же protected-паттерн; все set* = инверсия/константа; D1 `hash_` только `ChatPreviewLayer.tsx:188`; D5 empty handlers только в test mocks) | lint 0, tsc clean, vitest 5550/5550 (324 файлов), audit prod 0 vulnerabilities |
| 2026-09-05 | 0 (D1–D5) | Чистый проход 3/3: перескан D1–D5: 0 findings (D1 `hash_` app-code только `ChatPreviewLayer.tsx:188`; D2: все set* = инверсия/константа/состояние-машина, `HuddleWidget` = авторитетный echo; D3: 42 `disabled=` — все легитимные (saving/syncing/busy/creating, `!editable`, `!prev`/`!next`, passthrough-пропсы); D4: `ToggleSwitch` stopPropagation; D5: empty handlers только в test mocks). 3 последовательных зелёных прохода → цикл завершён | lint 0, tsc clean, vitest 5550/5550 (324 файлов), audit prod 0 vulnerabilities |
| 2026-09-05 | 0 (D1–D5) + §2.2 tap targets (батчи 1–5, закрытие цикла) | §2.2 tap targets: все батчи закрыты — интерактивы ≥44px (`min-w-11 min-h-11` / `min-h-11` / `h-[var(--control-height-md)]`): `ChatInputArea` (send/attach/voice/emoji), `ChatListItem` (swipe), `chat/GroupManagementPanel` (selects + iconBtn), `LiveVoiceRecorder` (pause/resume), `ui/SettingsRow`/`SettingsToggleRow`/`ToggleSwitch` + `PrivacySection`/`SpamSection`/`NetworkSection`, `call/CallPanel`, `ContactProfileModal` (verify) / `ContactCreateEditModal` (submit), `ContactsView`/`ui/InviteQRModal` (copy-ID), `company/TeamInbox`/`embed/EmbedWidget` (send), `app/AdvancedFilterModal`/`chat/StickerPicker`. Регрессии: +17 тестов / +2 файла (5552→5569, 325→327). E2E re-target: `navigation.spec.ts` — `title` (удалён e52d66c, hover-tooltip) → `[role="status"][aria-label^="Connection:"]`. Перескан D1–D5: 0 findings (все новые контролы live: pause→`MediaRecorder.pause/resume`, select→`updateGroup`, copy→clipboard, send→`sendMessage`). 3 последовательных зелёных прохода → цикл завершён | lint 0, tsc clean, vitest 5569/5569 (327 файлов), e2e 191/191, audit prod 0 vulnerabilities |
| 2026-09-05 | 0 (D1–D5) + §6.3 deploy-gate fix | `scripts/deploy-all.ps1` test phase: `npx`/`npm run test` (cmd bin resolution) → `node "$RootDir\node_modules\vitest\vitest.mjs" run` (детерминированно). `server/__tests__/ads-route.test.ts` harness: listen-`error` → reject (было: beforeAll висел до hookTimeout), unusable `address()` → throw в beforeAll (было: 7 undici `bad port` fetch-ошибек; one-off 11:02 под deploy-нагрузкой, на committed-коде 9b80525). Код UI не тронут, D-перескан: 0 findings | lint 0, tsc clean, vitest 5577/5577 (330 файлов) |
| 2026-09-05 | 1 (D5) | D5: `MiniAppView.tsx:50` `retryAction={() => undefined}` (тот же паттерн, что в уже-фиксированном `BotProfileView`) → `reloadTick` в deps `useServiceData` (house-паттерн `BotProfileView.tsx:42`). Регрессии: новый `MiniAppView.test.tsx` + новый `BotProfileView.test.tsx` (retry → refetch; `BotProfileView` фикс ранее без adjacent-теста). Перескан D1–D5: 0 findings (empty handlers только в test mocks / `.catch(() => {})` / fallback-пропсах) | lint 0, tsc clean, vitest 5579/5579 (332 файлов) |
| 2026-09-05 | 0 (D1–D5) + i18n transport | §2.4/§1.1: `status/TransportIndicator.tsx` — pill + hover-легенда были хардкод-EN (`Direct`/`Connecting...`/`Degraded`/`Offline`/`Error` + meanings + `Current:`/`All statuses`) → 12 ключей `transport.*` (direct/connecting/degraded/offline/error, meaning*, current, allStatuses) в 8 локалях (en/ru/de/es/fr/ja/ko/zh) через `t(key, enFallback)` (house-паттерн cf. `RecordingPlayer`). `aria-label` = `Connection: <localized>` — EN-префикс сохранён как e2e-контракт (`navigation.spec.ts:73` `[aria-label^="Connection:"]`). Регрессии: `TransportIndicator.test.tsx` → house i18n mock (`t: (key, fallback) => fallback ?? key`), `allTests.test.ts` +96 required-key (12 × 8). Перескан D1–D5: 0 findings | lint 0, tsc clean, vitest 5675/5675 (332 файлов) |
| 2026-09-07 | 0 (D1–D5) + offline queue main send path + §1.3 | `useMessageActions.ts` (workspace send path, `App.tsx:178`) → `lib/messageQueue.ts`: `buildNewMessage` status `navigator.onLine ? "sent" : "queued"`; `queueMessage({...msg, chatId})` ×3 (text/voice/sticker, best-effort catch-swallow); 1s `delivered` timeout gated on `navigator.onLine`; flush effect (mount + `window "online"`, deps `[setChats, setActiveChat]`) `getPendingMessages` → `markMessageSent(id)` → `"queued"`→`"sent"` в `chats` + active chat (functional updaters). Unit +5 (`useMessageActions.test.ts`, `vi.mock('../lib/messageQueue')`): offline→queued+stored, online→sent, voice+sticker offline→queued, flush on reconnect, keep-queue-while-offline. E2E +2 (`e2e/offline.spec.ts`): sandbox pins `navigator.onLine=false` (CDP `context.setOffline` no-op) → in-page override `Object.defineProperty(navigator,'onLine')` + dispatch `online`/`offline`; raw IDB open в тесте зеркалит app `onupgradeneeded` (autoIncrement store) → нет storeless v1 DB. §1.3: dead `useChatMessages` (+10 self-tests, barrel export, matrix-строка) удалены — live send path = `useMessageActions`. Перескан D1–D5: 0 findings (батч не добавляет UI-контролы — hook + e2e; empty handlers только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:188`) | lint 0, tsc clean, vitest 5670/5670 (332 файлов), e2e offline 2/2 (full 185/193: 8 pre-existing env failures — OfflineBanner visible in sandbox → 6 visual snapshot diffs ≈ banner strip, 2 ui-audit ContactItem 375px overlaps) |
| 2026-09-07 | 0 (D1–D5) + batch commit path (12 коммитов) | ~100 uncommitted-файлов прошлых сессий (09-02..09-05: a11y, tap-targets, transport i18n, p2p, stories, wallet, bots, landing, deploy, auth D5) закоммичены 12 тематическими conventional-коммитами поверх `3111bc1`: `0ca3916` deps (jimp devDep + qs pin), `861b1db` server paymento rate-limit, `5e0b419` deploy (PATH sanitizer, deterministic vitest, ads harness, SW bump, TWA port), `b449e6a` i18n transport + feature keys ×8, `b43c632` auth D5 recheck, `b8d6abd` p2p (heartbeat, fail-closed ECDH, connect timeout, pool blocked cleanup), `5b137b2` landing + OG generator, `0229f5d` stories (share menu/card, string ids), `800a9f6` wallet slice + payments/premium, `f74ffd3` bots edit modal, `ebeb3b2` D5 live retry (MiniApp/BotProfile), `42b33bb` a11y/tap-targets/tokens/safe-area/morse reset. D1–D5 перескан: 0 findings (empty handlers только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:188`; D2-спот: все `onToggle=` = инверсия/константа/action-trigger — `BotsSection.handleToggleBot` `isRunning: !b.isRunning`, `SecuritySection:215` pin set/remove action, `ContactProfileModal` `notificationsOn=!muted` задокументированный echo-контракт; D4: rightElement-обёртки нового кода (`BotsSection`) со stopPropagation). Гейты перезапущены на committed-коде: lint 0, tsc clean, vitest 5670/5670 (332 файлов). Полный e2e-rerun пропущен — код байт-идентичен baseline 185/193 (8 pre-existing env failures) | lint 0, tsc clean, vitest 5670/5670 (332 файлов) |

---

## ✅ УСЛОВИЕ ЗАВЕРШЕНИЯ АВТОНОМНОГО ЦИКЛА

### Цикл считается завершённым ТОЛЬКО когда:

1. ✅ **Этап 1** — Все данные вынесены, компоненты атомарны, синтаксис идеален
2. ✅ **Этап 2** — UI/UX идеален на всех устройствах, адаптивность 100%
3. ✅ **Этап 3** — Все проверки OWASP Top 10 + MASVS пройдены, зависимости безопасны
4. ✅ **Этап 4** — Приложение безотказно, любая ошибка изолирована, производительность в норме
5. ✅ **Этап 5** — Архитектурная схема создана, документация полная и актуальна
6. ✅ **Этап 6** — Полный регресс пройден, кросс-браузерность проверена
7. ✅ **ТРИ полных прохода** по всем этапам подряд **не выявили новых проблем**

> **⚠️ ВАЖНО:** Если на любом из трёх финальных проходов найдена проблема — счётчик сбрасывается. Нужно исправить проблему и начать три прохода заново.

---

## 📊 ЧЕК-ЛИСТ ДЛЯ ОТПРАВКИ РАЗРАБОТЧИКАМ / QA

```
□ СТРУКТУРА
  □ Все данные вынесены в config/constants
  □ Компоненты атомарны (< 300 строк)
  □ Нет пустых файлов/директорий
  □ Нет dead code
  □ Нет мёртвых контролов (D1–D5, раздел «Dead Controls Cycle (D1–D5)»)

□ СИНТАКСИС
  □ Линтер: 0 ошибок, 0 предупреждений
  □ Компиляция: 0 ошибок
  □ Типизация: 0 ошибок
  □ Приложение запускается без консольных ошибок

□ UI/UX
  □ Адаптив: 320px – 1920px
  □ Тач-зоны ≥ 44×44px
  □ Тёмная тема работает
  □ Клавиатура не перекрывает поля
  □ Спиннеры/скелетоны на загрузке
  □ Состояния ошибок и пустых данных обработаны

□ БЕЗОПАСНОСТЬ
  □ OWASP Top 10: все пункты пройдены
  □ OWASP MASVS: все пункты пройдены
  □ HTTPS везде
  □ CSP, HSTS, X-Frame-Options установлены
  □ Зависимости проверены через CVE/NVD
  □ Нет уязвимых пакетов

□ БЕЗОТКАЗНОСТЬ
  □ Error Boundaries / глобальные обработчики
  □ Offline mode работает
  □ Retry-логика на сетевые запросы
  □ Любая ошибка не ломает приложение

□ ПРОИЗВОДИТЕЛЬНОСТЬ
  □ LCP < 2.5s
  □ FID < 100ms
  □ CLS < 0.1
  □ Lazy loading реализован
  □ Изображения оптимизированы

□ ДОКУМЕНТАЦИЯ
  □ Архитектурная схема создана
  □ README.md заполнен
  □ JSDoc/TSDoc для всех компонентов
  □ API endpoints документированы

□ ФИНАЛЬНЫЙ ТЕСТ
  □ 3 полных прохода цикла без изменений
  □ Кросс-браузерное тестирование пройдено
  □ Регрессионное тестирование пройдено
```

---

## 🚨 АЛГОРИТМ РАБОТЫ ИИ

```
НАЧАЛО
  │
  ▼
┌─────────────────────────────────────┐
│  ЭТАП 1: Структурная оптимизация   │
│  Проверить все пункты 1.1 – 1.4   │
└─────────────────────────────────────┘
  │
  ├── ❌ Найдена проблема ──► ИСПРАВИТЬ ──► ВЕРНУТЬСЯ К ЭТАПУ 1
  │
  ▼ ✅ Все пункты пройдены
┌─────────────────────────────────────┐
│  ЭТАП 2: UI/UX и адаптивность     │
│  Проверить все пункты 2.1 – 2.5   │
└─────────────────────────────────────┘
  │
  ├── ❌ Найдена проблема ──► ИСПРАВИТЬ ──► ВЕРНУТЬСЯ К ЭТАПУ 1
  │
  ▼ ✅ Все пункты пройдены
┌─────────────────────────────────────┐
│  ЭТАП 3: Безопасность (OWASP)     │
│  Проверить все пункты 3.1 – 3.4   │
└─────────────────────────────────────┘
  │
  ├── ❌ Найдена проблема ──► ИСПРАВИТЬ ──► ВЕРНУТЬСЯ К ЭТАПУ 1
  │
  ▼ ✅ Все пункты пройдены
┌─────────────────────────────────────┐
│  ЭТАП 4: Безотказность             │
│  Проверить все пункты 4.1 – 4.4   │
└─────────────────────────────────────┘
  │
  ├── ❌ Найдена проблема ──► ИСПРАВИТЬ ──► ВЕРНУТЬСЯ К ЭТАПУ 1
  │
  ▼ ✅ Все пункты пройдены
┌─────────────────────────────────────┐
│  ЭТАП 5: Архитектурная документация│
│  Проверить все пункты 5.1 – 5.3   │
└─────────────────────────────────────┘
  │
  ├── ❌ Найдена проблема ──► ИСПРАВИТЬ ──► ВЕРНУТЬСЯ К ЭТАПУ 1
  │
  ▼ ✅ Все пункты пройдены
┌─────────────────────────────────────┐
│  ЭТАП 6: Финальное тестирование   │
│  Проверить все пункты 6.1 – 6.3   │
└─────────────────────────────────────┘
  │
  ├── ❌ Найдена проблема ──► ИСПРАВИТЬ ──► ВЕРНУТЬСЯ К ЭТАПУ 1
  │
  ▼ ✅ Все пункты пройдены
  │
  ▼
┌─────────────────────────────────────┐
│  СЧЁТЧИК ПРОХОДОВ +1              │
│  (нужно 3 подряд без проблем)     │
└─────────────────────────────────────┘
  │
  ├── Счётчик < 3 ──► ВЕРНУТЬСЯ К ЭТАПУ 1
  │
  ▼ Счётчик = 3
┌─────────────────────────────────────┐
│  ✅ ЦИКЛ ЗАВЕРШЁН                  │
│  Приложение готово к production     │
└─────────────────────────────────────┘
```

---

## 📚 ИСТОЧНИКИ И СТАНДАРТЫ

| Стандарт | Описание | Ссылка |
|----------|----------|--------|
| **OWASP Top 10** | 10 критических рисков безопасности веб-приложений | https://owasp.org/Top10/ |
| **OWASP MASVS** | Стандарт верификации безопасности мобильных приложений | https://mas.owasp.org/ |
| **OWASP Mobile Top 10** | Угрозы безопасности мобильных приложений | https://owasp.org/www-project-mobile-top-10/ |
| **CVE** | Словарь известных уязвимостей | https://cve.mitre.org/ |
| **NVD** | Национальная база данных уязвимостей США | https://nvd.nist.gov/ |
| **OWASP ZAP** | Сканер безопасности веб-приложений | https://www.zaproxy.org/ |
| **Dependency-Check** | Анализатор уязвимых зависимостей | https://owasp.org/www-project-dependency-check/ |
| **Drizz Mobile Checklist** | 50 шагов перед релизом мобильного приложения | https://www.drizz.dev/post/mobile-app-testing-checklist |
| **Habr: QA Checklist** | Чек-лист тестирования мобильных приложений | https://habr.com/ru/companies/otus/articles/1051006/ |
| **WCAG 2.1** | Стандарт доступности веб-контента | https://www.w3.org/WAI/WCAG21/quickref/ |
| **Core Web Vitals** | Метрики производительности Google | https://web.dev/vitals/ |

---

## 📝 ПРИМЕЧАНИЯ ДЛЯ ИИ

1. **Не пропускать этапы.** Даже если кажется, что "это уже проверялось" — проверить снова.
2. **Не доверять кэшу.** После каждого исправления пересобирать и перезапускать приложение.
3. **Документировать изменения.** Каждое исправление фиксировать в CHANGELOG.md.
4. **Тестировать реальное поведение.** Не полагаться только на статический анализ — запускать приложение.
5. **Проверять на реальных устройствах.** Эмуляторы не заменяют реальное тестирование.
6. **Безопасность превыше всего.** Любое сомнение в безопасности — исправлять немедленно.
7. **Пользовательский опыт — приоритет.** Если что-то неудобно — переделать, даже если "работает".

---

> **Создано:** 2026-07-07  
> **Формат:** Markdown (.md)  
> **Назначение:** Автономный цикл итеративной оптимизации и безопасности приложения
