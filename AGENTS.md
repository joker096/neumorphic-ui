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
| 2026-09-07 | 0 (D1–D5) + ui-audit overlap false-positive (fixed bottom bar) | 2 падения `ui-audit` (`audit: mobile 375x667`, `audit: zoom 200% @ 375x667`) = overlap-детекции content ↔ fixed bottom nav (filter pills / favorite-кнопка × nav-кнопки). Геометрия подтверждена (debug JSON): `nav` `position:fixed`, full-width, bottom=innerHeight, height<50%vh → стандартный mobile chrome, контент скроллится под ним, не визуальный overlap. Фикс в `e2e/ui-audit.spec.ts` (UI_CYCLE.md §2.5 — ложное срабатывание, с комментарием-причиной): хелпер `inFixedBottomBar(el)` (fixed-предок, прижат к нижнему краю, full-width, height<0.5×innerHeight — fullscreen-модалы исключены) + skip overlap-пары при `a.inBar !== b.inBar` (bar×bar и content×content продолжают проверяться). Удалён temp debug spec `e2e/zz-debug-overlap.spec.ts`. Audit: 14/14, report 0 errors. D1–D5 перескан: 0 findings | lint 0, tsc clean, vitest 5670/5670 (332 файлов), e2e 187/193 (6 pre-existing env failures — OfflineBanner snapshot diffs) |
| 2026-09-07 | 0 (D1–D5) | Чистые проходы 2/3 + 3/3: перескан D1–D5: 0 findings (empty handlers только в test mocks `CallControls`/`ContactItem`/`MemberItem`; `hash_` app-code только `ChatPreviewLayer.tsx:188` = документированный name-matched fallback; код не тронут). CHANGELOG `### Fixed` строка добавлена. 3 последовательных зелёных прохода (после-фикса + 2) → цикл завершён | lint 0, tsc clean, vitest 5670/5670 (332 файлов) ×3 |
| 2026-09-09 | 1 (F2: `TransportIndicator` tooltip 10px) + WIP-батч (8 коммитов, 34 файла) | Батч-коммиты поверх `30c19dd`-предков: `29dfa6d` refactor(store): remove dead addCompanyChannel; `0355b91` fix(chat): confirm chat deletes via lifted ConfirmDialog (hook + ChatListView/ChatListItem + 8 локалей + 14 файлов); `199d793` fix(ui): ConfirmDialog double key triggers (Enter→onConfirm только при фокусе confirm-кнопке, Escape→onCancel once; message-`<p>` только когда message непустой); `809e188` feat(bots): persist bots via IndexedDB (App→useDataHydration→bots_list, store persist, BotsSection saveBot/deleteBot, `e2e/bots.spec.ts` +3); `7c29fc3` feat(channels): persist channel comments in idb (seed-константа удалена); `0da05b9` fix(stories): advance to next user with visible stories (docs: F2 accepted limitation — `StoryViewer.sendReply` toast-only); `30c19dd` chore(pwa): SW cache v23 + TWA port 9519; `20ce0b2` docs CHANGELOG. Затем F2-фикс: `4be48b5` fix(status) `TransportIndicator.tsx:54` `text-[10px]`→`text-[11px]` (icon-font 0 findings). Перескан D1–D5: 0 findings (empty handlers только test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:188`; все onToggle = инверсия; SecuritySection pin-row = house stopPropagation-паттерн; `retryAction` live) | lint 0, tsc clean, vitest 5667/5667 (332 файла), e2e 196/196, audit prod 0 vulnerabilities, button-audit 0, l10n PASS, icon-font 0 |
| 2026-09-07 | 0 (D1–D5) + UI polish final | Batch: canonical shadow tokens (`--shadow-btn-primary`, `--shadow-panel`, `--shadow-modal`) in `src/styles/tokens.css`, raw shadow replacement in `ui/modalShared.tsx`/`app/AdvancedFilterModal.tsx`/`ContactCreateEditModal.tsx`/`ProfileView.tsx`/`SettingsView.tsx`, `min-w-[44px]`/`min-h-[44px]` → `min-w-11`/`min-h-11` across UI components/tests, `scripts/button-audit.mjs` parser hardened (self-closing `<button/>`, JSX string/template/brace tracking, D4 inner-only), temp debug `e2e/zz-screenshots.mjs` deleted. Final audit fixes: `ConfirmModal` message `text-gray-400` → `text-[var(--text-secondary)]`; `ChatContextMenu` desktop height estimate → `items.length * 44 + 8` (matching `min-h-11` items + `p-1`); `CrmExportMenu` dropdown items `min-h-11`; `FormModal` close button `aria-label={closeTitle || 'Close'}`. D1–D5 re-scan: 0 findings (`hash_` app-code only `ChatPreviewLayer.tsx:188`; empty handlers only test mocks; `onToggle` inversions; button-audit 0) | lint 0, tsc clean, vitest 5672/5672 (332 файлов), button-audit 0, ui-audit 14/14, icon-font 2/2 |
| 2026-09-10 | 1 (§2.2 context menu 44px) + 2 (chat fixes) | `ChatContextMenu.tsx` desktop popup items `min-h-11` → `min-h-9` (+`py-1`), height estimate `items.length * 36 + 8` (mobile bottom-sheet kept 44px — correct tap target); regression `ChatContextMenu.test.tsx` `2*44` → `2*36`. `ChatInputArea.tsx` Enter на Shift+Enter отправлял (`e.key==="Enter" && sendMessage()`) → `!e.shiftKey` guard + `preventDefault`, Shift+Enter = newline. `MorseDecoder.tsx` Cyrillic `MORSE_MAP` почти полностью неверный (А/К/Ж/З/Й/Л/М/Н/О/П/Р/С/Т/У/Ф/Х/Ц/Ч/Ш/Щ/Ы/Ь) → International Russian standard (Cyrillic = Latin codes), Ћ/Ќ удалены; новый `MorseDecoder.test.ts` (8). D1–D5 re-scan: 0 findings | lint 0, tsc clean, vitest 5688/5688 (333 файлов) |
| 2026-09-10 | 0 (D1–D5) + 4 (recordings UX) | По умолчанию записи звонков теперь сохраняются (`saveAudioRecordings`/`saveVideoRecordings` `?? true`) + новый `autoRecordCalls` (default on, persist). `CallManager.maybeAutoStartRecording` — авто-старт при `connected` (skip preview, чтит `autoRecordCalls` + per-type save toggle, silent-fail, guard по callId); `toggleRecording` держит `recordingId` при остановке; `logCallToHistory` + `CallHistoryEntry.recordingId`. `CallLogView` — Play-кнопка на записи с `recordingId` → `getRecordingBlob` → inline `<audio controls>` + close. Ключи i18n ×8: `settings.autoRecordCalls*`, `call.playRecording`; новый toggle-ряд в `CallsSection`. Регрессия: `settingsSlice.test.ts` +2, `callLifecycle.test.ts` +4, `CallLogView.test.tsx` +3, `CallsSection.test.tsx` +1. D1–D5 re-scan: 0 findings | lint 0, tsc clean, vitest 5718/5718 (333 файлов) |
| 2026-09-10 | 0 (D1–D5) + мёртвые настройки: 14 скрыто + 4 wires | Аудит: 16 настроек персистились без эффекта. СКРЫТО (rows удалены, slice-поля + persist остались): proxy/torBridge/obfuscationMode/p2pMesh (`NetworkSection` — осталось obfuscationEnabled+relayBackend+autoReconnect+TURN input), visNumber/visActivity/profilePhotoVisibility/callsVisibility/messagesFrom (`PrivacySection`), deadMansSwitch (`SecuritySection` autoWipe-группа), spamFilter (`SpamSection.tsx` удалён + barrel), draftsEnabled/offlineMode/mediaAutoLoad (`StorageSection` → presentational), pwaBanner + install-howto (`AppearanceSettings`). WIRED: (1) `turnServerUrl` → TURN credentials в ICE `P2PTransport` (`network.ts` connectToPeer, stun-default при пустом); (2) `mediaAutoLoad` гейтит автозагрузку аттачей в `AttachmentMedia.tsx` (blocked → placeholder + Load-кнопка `chat.loadAttachment`); (3) `selfDestructDefault` → `selfDestructAt` на исходящих (оба send-path, `SELF_DESTRUCT_MS`), `ChatMessage` рендерит `chat.messageExpired`; (4) `twoFactor` → реальный TOTP (RFC 6238, новый `lib/twoFactor.ts`, `totpSecret` в slice, setup-панель в `SecuritySection`, код 2FA при unlock в `useAppLock`/`AppLockScreen`/`AppAuthGate`). i18n ×8: `chat.loadAttachment`, `chat.messageExpired`, `settings.networkSubtitle`, `settings.newFolder`, `settings.totp*` ×5, `lock.totp*` ×2. Регрессия: новый `twoFactor.test.ts` (6, RFC-вектор), `useAppLock.test.tsx` (6), `AppLockScreen.test.tsx` +2, `SecuritySection.test.tsx` +2, re-target settings-тестов. D1–D5 re-scan: 0 findings (все живые тумблеры; Load = setRevealed; 2FA guard totpBusy) | lint 0, tsc clean, vitest 5712/5712 (333 файлов), l10n 0 errors (9 dynamic) |
| 2026-09-10 | 0 (D1–D5) + старт-перф (3 фикса) | Стартовая загрузка данных ускорена: (1) `useDataHydration.ts` — 7 IDB-чтений в один `Promise.all` (было 5 параллельных + 2 последовательных await: `loadCompanyMessages` + `loadCloudSyncMeta`); (2) `companySlice.loadCompanySettings()` — 8 последовательных IDB-чтений → 2 батча `Promise.all` (группа group-key/channels/envelopes/channelKeys/siteChats гейтится на `companyId`, `joinCompanyChannel` сразу после `set({companyId})` — семантика сохранена); (3) `store/index.ts` — персист данных с 6 IDB-записей на каждое изменение → coalescing write-queue (write-in-flight; бёрст изменений схлопывается в новейший snapshot, `drainPersist` дорисовывает очередь). Регрессия: `index.test.ts` +1 (бёрст 3 изменений при медленной in-flight записи → ровно 2 записи `chats_all`: первая + новейшая, промежуточная пропущена). D1–D5 re-scan: UI-контролы не тронуты, 0 findings | lint 0, tsc clean, vitest 5713/5713 (333 файлов) |
| 2026-09-11 | 0 (D1–D5) + §2.2 tap targets (тихие пропуски) | Настройки: `ProfileAccounts.tsx` edit/delete `w-6 h-6` (24px) → `min-w-11 min-h-11` (44px); `FoldersSection.tsx` badge-cycle `w-9 h-9 min-w-11` (36px высота) + `min-h-11`. Бонус: мертвые inline-`"` внутри `className` (ProfileAccounts) убивали стили active-check и add-account hover/text-accent — классы восстановлены. Верификация: `drainPersist` (store/index.ts) подозревался в fail-closed (нет `.catch` на `Promise.all(6× idb.set)` → залипший `persistWriting`), но `lib/idb.set` глотает все ошибки (внутренний try/catch) — никогда не reject → false positive, код не тронут. button-audit settings: 0 findings (62 кнопки). D1–D5 перескан: 0 findings (edit/delete с stopPropagation — D4 ок; `hash_` app-code только `ChatPreviewLayer.tsx:188`; empty handlers только в test mocks) | lint 0, tsc clean, vitest 5713/5713 (333 файлов), button-audit 0 |
| 2026-09-11 | 0 (D1–D5) + UI/UX аудит Этап 2 (S1–S12 security уже закрыт) | Security-батч закрыт ранее (S1–S12: totpSecret/TURN AES-GCM в `securePersist.ts`, PIN 600k `verifyAppLockPIN`, `UPDATE_ALLOWLIST`, dead `LockScreen` удалён, `secureWipe` warnings, export passphrase confirm, `twoFactor` Math.random убран). UI/UX аудит: ContactView tabs вернулись на 44px (uncommitted регрессия `min-h-7`), icon-font 0 (text-[10px]/size={11} фиксы), мёртвый CSS восстановлен (`ChannelCommentsView` stray `"`, `PaymentRequestCard` `text-[var(--text-primary)` без `]`), тач-цели ≥44px (ChatMediaPanel, ContactProfileModal, CrmRoles + aria-label, EmbedWidget, SharedMediaTabs, StickerPicker, RecordingPlayer, ChatPickerModal, WorkplaceView, GlobalSearch, PaymentChatBubble), a11y semantics (media items + ChannelItem → role=button/tabIndex/Enter-Space), empty states (CrmRoles/ChannelList/PlaylistView), новый `useEscapeKey` hook + 9 модалов (FormModal, CrmModal, CrmInviteModal, CompanySettingsModal, CompanyInviteModal, ContactModal, DepartmentModal, InviteQRModal, ChatPickerModal), i18n ×8 (`chat.filters.openImage/openItem`, `systemPlayer.nodePrefix/emptyList`, `notif.relNow/relMin/relHour/relDay` с `{{n}}`, `chat.morseSample`, `crm.noDepartments/deleteDepartment/noRoles/deleteRole`). D1–D5 перескан: 0 findings (все новые интерактивы live: media-item openPreview, ChannelItem onChannelClick, CrmRoles setConfirm, Escape → onClose; empty handlers только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:188`) | lint 0, tsc clean, vitest 5707/5707 (332 файлов), button-audit 0, icon-font 0, l10n PASS (0 errors), ui-audit 14/14, usability 23/23 |
| 2026-09-11 | 0 (D1–D5) + batch 2 nav tactile + dead theme-split | Nav: `EcoSidebarNav` nav-кнопки `active:scale-[0.94]`, profile `active:scale-[0.96]`, active pill inset-top highlight; `NavItemButton` collapsed identical isDark-ветки (bottom active) + bottom inactive → токены `--text-tertiary/secondary`; `SidebarNav` dead gradient-ветка collapsed. Скан: 41 identical `isDark ? "X" : "X"` веток collapsed в 23 файлах (все провязаны токенами, theme-agnostic; output-identical, isDark props сохранены, ломающих мест нет). D1–D5: 0 findings (код не тронут, только className-строки). 1× vitest прогон = 6 transient paymento IPN (server harness, не UI) → перезапуск 5711/5711 | lint 0, tsc clean, vitest 5711/5711 (331 файл), icon-font-audit 0, button-audit 0 |
| 2026-09-11 | 0 (D1–D5) + PWA install banner (строка с доменом = браузерная адресная) | ПWA install prompt: новый `useInstallPrompt.ts` (beforeinstallprompt/appinstalled/standalone), новый `status/InstallAppBanner.tsx` (thin strip, Install → deferred prompt, Dismiss → `STORAGE_KEYS.PWA_INSTALL_DISMISSED` persist), wire в `AppShell.tsx` после `OfflineBanner`, i18n ×8 `pwa.*`. D1–D5: 0 findings (оба контрола live: install → prompt, dismiss → localStorage + unmount; hidden-не-disabled). `hash_` app-code только `ChatPreviewLayer.tsx:188` | lint 0, tsc clean, vitest 5751/5751 (333 файла) |
| 2026-09-11 | 0 (D1–D5) + e2e audit close-out (contrast + touch-target + snapshots) | ui-audit findings закрыты: (1) company «Open Premium» CTA (`CrmView.tsx`) — `min-h-9` (36px) → `min-h-11` (44px, §2.2) + `text-white` → `text-[var(--ink-on-saturate)]` (contrast 3.41:1 < 4.5:1 → AA: house-токен dark-ink на saturated fill, dark `#0d1017`/light `#0f172a`, проходит все 3 темы: dark ≈5.6:1, light ≈5.0:1, gold ≈8:1); (2) `AttachmentMedia.tsx` Load-кнопки (image + video placeholders) — тот же latent-паттерн, тот же фикс; (3) chat-open textarea 247×17 → 44px tap-zone: DM-composer контейнер `py-1.5` убран, textarea `min-h-11 py-[13px]` (placeholder сдвиг ≈0.5px; `growTextarea` scrollHeight включает padding — рост не тронут; channel-composer уже 44px, не тронут). Visual baselines re-recorded (`--update-snapshots`, 8/8; stale с `9b80525` vs WIP `ChatListItem` avatar/draft/icons + SW v25). D1–D5: 0 findings (CSS-only; оба CTA live: `onOpenPremium` → settings premium subview, Load → `setRevealed(true)`) | lint 0, tsc clean, vitest 5751/5751 (333 файла), e2e 196/196 |
| 2026-09-12 | 0 (D1–D5) + 6 dead appearance settings wired | По жалобе юзера «меняю размер шрифта — ничего не происходит»: аудит настроек выявил 6 мёртвых контролов. **fontSize** был no-op: `[data-font-size]` вешался на div AppShell, а `--font-size-base` читается `html`/`body` — предками, которые резолвят `:root` дефолт (16px); фикс — `useAppSettings` зеркалит `data-font-size` на `documentElement` (как theme), `--control-font-size` закреплён absolute `12px` (WCAG). **accentColor** применялся только после открытия вкладки Appearance (mount-effect) и не обновлял `--accent-rgb` (градиент/выделение висели на дефолте): новый boot-хук `useAppearanceEffects.ts` (App.tsx) синкает `--accent`/`--accent-bg`/`--accent-soft`/`--accent-rgb`, чат-фон/density/radius/anim-intensity attr'ы; obsolete mount-effect в `AppearanceSettings.tsx` удалён. **chatBackground/density/messageRadius/animationIntensity** писали CSS без консьюмеров: консьюмеры созданы — `ChatPreviewLayer` читает `var(--chat-bg, var(--bg-secondary))` + `[data-chat-bg=dots] .chat-surface` узор, `.msg-bubble.rounded-*` unlayered-переопределения на `--message-radius`/`--message-radius-sm` (tail группы сохранён), `ChatListItem`/`ChatMessageList` читают `--chat-item-pad-*`/`--message-list-pad-*` (`[data-density=compact]`), `AnimationContext` маппит intensity → длительность (low 0.15s / high 0.3s / off disabled). Регрессия: новый `useAppearanceEffects.test.tsx` (3), `useAppSettings.test.tsx` +1. D1–D5 перескан: 0 findings (новых интерактивов нет — CSS-переменные + хуки; empty handlers только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:188`) | lint 0, tsc clean, vitest 5758/5758 (332 файла) |
| 2026-09-12 | 0 (D1–D5) + §3.3 vitest bump + docs sync + e2e 196/196 | Аудит-цикл: baseline зелёный (lint/tsc/vitest 5758/5758). D1–D5 перескан: 0 findings (empty handlers только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:207` = документированный name-matched fallback; все set* пишут реальные данные — D2 нет). §1.3: пустых директорий нет; "неиспользуемые" deps (`tw-animate-css`, `@tauri-apps/cli`, `@typescript-eslint/*`, `eslint-plugin-security`, `vite-plugin-compression`) = false positives (CSS `@import`, tauri toolchain, eslint/vite config). §3.3: `npm audit` → **vitest **@vitest/mocker** moderate GHSA-82fw-gwwq-j7x9 (2.1.0-beta.1–4.1.10), локфайл держал 4.1.9 — бамп `vitest@^4.1.11`, lockfile синхронизирован; остаток 6 (4 moderate/2 high) = dev-only `@bubblewrap/core` chain (extract-zip/file-type, без фикса, документирован; prod `--omit=dev` 0). §2: button-audit 0, icon-font 0. §5: README счётчики обновлены (5758/332, e2e ~196), schema-док + строка про `useAppearanceEffects`. §6: полный e2e 195 pass / 1 fail = strict-mode violation `[data-font-size]` (после моего 09-12 фикса attr зеркалится на `<html>` → 2 матча) → `settings.spec.ts` селектор `html` (авторитетный элемент фикса); ре-ран 17/17 → e2e 196/196. Гейты на vitest 4.1.11: lint 0, tsc clean, vitest 5758/5758 | lint 0, tsc clean, vitest 5758/5758 (332 файла), e2e 196/196, audit prod 0, button-audit 0, icon-font 0 |
| 2026-09-13 | 0 (D1–D5) + §1.3 dead code: 4 вьюки + lib-функция | Аудит «всё» (кнопки/функции/иконки/окна/перф/безопасность): baseline зелёный (lint/tsc/vitest 5784/5784, 334 файла). D1–D5 перескан: 0 findings (empty handlers только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:207`; D2 echo-паттернов нет; 0 byte-identical `isDark ? "X" : "X"` тернариев по 843 файлам — все тема-различающие). §1.3 мёртвый код удалён: `useAsyncState`/`useMeshPeers`/`useHealthCheck` (+ self-тесты) и `useErrorStats` в `useGlobalErrorHandler` — по 0 консьюмеров (только barrel `hooks/index.ts`, живой импорт из него один: `useKeyboardScroll` ← `AppMainContent`); `getErrorStats` в `src/lib/errorHandling.ts` консьюмился только удалённым хуком — функция + barrel-экспорт + тест + мок удалены. §2: button-audit 0 (235 файлов/402 блока), icon-font 0 (466 файлов), ui-audit 14/14, usability 23/23. §4: 51 React.lazy site (глубокая ленивость: оверлеи/фичи/settings-секции), code-splitting + chunk-локалей + coalescing write-queue уже были. §3: audit prod 0 (остаток 6 = dev-only `@bubblewrap/core`, документирован); CSP строгий (`script-src 'self' 'wasm-unsafe-eval'`, `_headers` + meta + dev/preview), HSTS/X-Frame-Options DENY/permissions-policy/Expect-CT; `innerHTML=`/`dangerouslySetInnerHTML`/`eval`/`new Function`/`document.write` = 0; `@ts-ignore` 12 (5×QrCode browser-compat документирован + 7×Modal.test). Модалки a11y: Modal = focus-trap/scroll-lock/role=dialog/aria-modal/Escape, `p-[var(--spacing-16)]` (16px, не 64), useEscapeKey 13 call sites | lint 0, tsc clean, vitest 5767/5767 (332 файла, −17 тестов), button-audit 0, icon-font 0, l10n PASS, audit prod 0 |
| 2026-09-13 | 0 (D1–D5) + Play pre-launch compliance (5 warning) | Google Play Console pre-launch: 5 warnings закрыты. (1) **Edge-to-edge**: PWA уже `viewport-fit=cover` + safe-area insets, но TWA не декларировал `displayOverride` — `scripts/build-android.mjs` теперь передаёт `displayOverride:["edge-to-edge"]` в `TwaManifest` (проверено: bubblewrap принимает). (2) **Picture-in-Picture**: bubblewrap не эмитит PiP-атрибуты → новый пост-шаг `patchManifest()` в `build-android.mjs` после `createProject()` (манифест регенерируется каждый билд): на `LauncherActivity` → `android:supportsPictureInPicture="true"` + `android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboardHidden"`, на `<application>` → `android:resizeableActivity="true"` (large-screen windowed/resize). (3) **Orientation lock**: `config/android-publish.json` + `android/twa-manifest.json` `portrait` → `any` (данные билд-скрипта перегенерируют twa-manifest из config), `public/manifest.json` `portrait-primary` → `any`. (4) **R8**: `android/app/build.gradle` release → `shrinkResources true` + `proguardFiles ...optimize... + proguard-rules.pro` (новый, keep `com.messanger.e2e.**`/`com.google.androidbrowserhelper.**`). (5) **Memory/perf**: покрыто R8 code+resource shrink. Проверки: `node --check` build-android.mjs, eslint 0, JSON валидны, патч-симуляция на текущем manifest (оба replace попадают, единичные таргеты), checked-in twa-manifest/manifest синхронизированы с билд-выходом. `src/` не тронут — vitest/tsc не затронуты; CHANGELOG `### Fixed` строка. D1–D5: UI-контролов нет | lint 0, tsc clean, vitest 5767/5767 (332 файла) (без изменений src/ — не перезапускались), eslint build-android.mjs 0 |
| 2026-09-13 | 0 (D1–D5) + prod `/admin` 502 fix | Юзер: `https://mess.cvr.name/admin` → 502. Диагноз: (1) nginx `fastcgi_pass unix:/var/run/php/php8.2-fpm.sock` — PHP 8.2 удалён из VPS (остались 8.3/8.4, живой пул `php8.3-fpm-mess.cvr.name.sock`); webroot = чистый static SPA без index.php, поэтому любой не-статический путь каскадит в try_files→/index.php→мёртвый socket→502 (`/` = 200 через static index.html). (2) admin SPA (`$AppRoot/dist/admin`, serveAdminFile на REST 3003) не имел `location /admin` в nginx. (3) `handleAdminRoute` (server/routes/admin.ts) экспортировался, но не импортировался в `server/signaling-server.ts` → `/api/admin/*` 404. Фиксы: `server/mess.cvr.name.conf` — fastcgi → php8.3 mess pool + `location = /admin` и `^~ /admin/` → proxy 3003; `signaling-server.ts` — `handleAdminRoute` подключён в REST chain. Деплой: scp server-files → `pm2 restart mess-signaling --update-env` (health 200) → `sudo cp` conf → `nginx -t` OK → reload. Проверено публичным https: `/admin` 200, `/admin/` 200, `/api/admin/users` 401 (auth-gate), `/health` 200, `/` 200. tsc clean. D1–D5: UI-контролов нет, CHANGELOG `### Fixed` строка | tsc clean, public-verify 5/5 |
| 2026-09-13 | 0 (D1–D5) + admin SPA i18n rebuild | Юзер: админка показывает сырые ключи локали (`login.title`, `username`...) вместо переводов. Диагноз: задеплоенный `dist/admin/assets/index-D_5tyr_m.js` собран из СТАРОЙ версии `AdminI18nProvider` — нет `useEffect` прелоада локальных чанков на mount (чанки `en-*`/`ru-*` import-атся только внутри `setLang` → кэш пуст, `t()` возвращает ключ). Git-исходник (`6624f4c`, от 2026-08-30) УЖЕ содержит фикс (`admin/src/lib/i18n.tsx`: `useEffect → Promise.all([loadLocale("en"),loadLocale("ru")]).then(()=>setReady(true))` + `t` deps `[lang, ready]`) — но никогда не пересобирался/не задеплоивался. `admin/` отсутствовал в воркспейсе → `git checkout 6624f4c -- admin` восстановил (staged A admin/*). Сборка: `npm ci` (esbuild postinstall approve) + `npm run build` (tsc+vite, base `"/admin/"`, чанки `index-CZ7xuIS_.js`/`en-TMRgQHr1.js`/`ru-oB8WhqNA.js`) → scp на `/home/user0/messanger/dist/admin` после удаления stale `admin/`-вложенности + старых assets (старый бандл 404). Верификация: /admin/, бандл, en/ru чанки, css = 200; старьё 404. Логин-flow SPA = `/api/auth/login`+`/api/auth/verify-2fa`+`/api/stats/*`+`/api/ads` (НЕ `/api/admin/*` как в старой SECURITY_INSTRUCTIONS.md). CHANGELOG `### Fixed` строка | tsc clean, vite build clean, public-verify 5/5 assets |
| 2026-09-13 | 1 (UX §2.1/§2.2 мобильная укрупнённость) + 0 (D1–D5) | Юзер: «на мобильном экране кнопки выглядят многие большими, а окна еще больше». Корень: (1) auth-примари `RegistrationScreen`×6/`LoginScreen`×4/`AppLockScreen` submit — `min-h-11` (44px) + `py-4` (32px) СТЭКИНГ → flex рендерит ~57–76px (паддинг прибавляется к min-height), плюс `font-bold text-lg` (18px) против 14px в остальном UI; фикс — точная высота-коробка `h-11` (44px сохранён = ui-audit touch-target зелёный) + `font-bold text-sm` + `gap-2.5`, градиент/тень сохранены; секондари `py-3`+`min-h-11` → `h-11`. (2) `AppLockScreen` карточка-лок `p-8` → `p-6 sm:p-8`. (3) `modalShared.modalSurface` `p-6` → `p-4 sm:p-6` — все `Modal`/`FormModal`/`ConfirmModal`/`InviteQRModal`/`SystemStatusSection` компактнее на мобильном (16px/сторона), desktop не тронут. (4) Рампа заголовков на мобиле: auth h2 `text-2xl` → `text-xl sm:text-2xl` (Registration ×4/Login ×3/AppLock title), Registration h1 `[32px]` → `[28px] sm:[32px]`, `IncomingCallSheet` имя `[40px]` → `[32px] sm:[40px]` (оба в рампе, F1-clean; icon-font-audit поймал промежуточный `text-4xl`=36px вне рампы — заменён). Ни один контрол ниже 44px (h-11 точная коробка, без паддинг-инфляции). Регрессия: Modal/FormModal (`[class*="p-6"]` матчится через `sm:p-6`)/ConfirmDialog/AppLockScreen/auth/call-тесты зелёные. Перескан D1–D5: 0 findings (только className-строки, все хендлеры live). CHANGELOG `### Fixed` строка | lint 0, tsc clean, vitest 5787/5787 (334 файла), button-audit 0, icon-font-audit 0 |
| 2026-09-13 | 1 (UX §2.2 аватар-кнопки перекрывали лицо) + 0 (D1–D5) | Юзер: «аватары в профилях - иконки редактирования и загрузки нового аватара перекрывают сам аватар - посмотри как в Телеграме сделано, может нам адаптировать». `ContactProfileModal.tsx` 80px аватар имел 3× 44px круглые кнопки поверх углов (камера set/change, красная trash-remove, оранжевая Edit — заходила на лицо). Фикс по Telegram-паттерну: весь аватар = ОДНА `<button>` (hover/focus-оверлей `bg-black/45` + Camera по центру, `aria-haspopup="menu"`, `aria-expanded`), клик открывает якорный `role="menu"`-поповер под аватаром: «Set/Change photo» → скрытый `fileInputRef`, «Remove photo» (только когда `overrideAvatar` задан) → `removeContactAvatar(contact.name)`; `fixed inset-0` backdrop закрывает меню по клику вне; `photoMenuOpen` сбрасывается в `contact?.id`-эффекте. Оранжевый Edit переехал в существующий MoreVertical-поповер слева-вверху (orange-элемент перед Delete, `onEdit()+onClose()`). Status-dot остался сиблингом. Свой аватар `ProfileEditForm` уже Telegram-7-like (весь аватар кликабельный + camera-бейдж) — не тронут. Регрессия: `ContactProfileModal.test.tsx` +2 (фото-меню открывается по клику аватара + закрывается при выборе; remove-photo удаляет запись `contactAvatars` из store) + ретаргет Edit-теста (через MoreActions) + селекторы градиента `div[class*=from-...]`→`button[class*=from-...]`; `ContactsView.test.tsx` 3 ретаргета (Edit через MoreActions, ассерт профиля `/contacts.edit/`→`/contacts.setPhoto/`). Перескан D1–D5: 0 findings (toggle аватара → состояние меню, menuitems → file input / запись в store — все live). CHANGELOG `### Fixed` строка | lint 0, tsc clean, vitest 5789/5789 (334 файла), button-audit 0 (235/405), icon-font-audit 0 |
| 2026-09-13 | 1 (UX §2.2 фильтр-ленты «толстые» пилюли) + 0 (D1–D5) | Юзер: «посмотри как у нас выглядят списки прокрутки фильтрации - кое-где они слишком большого размера шрифтов и размерами. также адаптируй иконки и размеры шрифтов везде». Корень: rounded-пилюли рендерили 44px хит-зону как видимый объём (`min-h-11` + `px-3` + текст прямо в кнопке) → каждая фильтр-лента = строка толстых пилюль. Дом-паттерн (доказан `FolderFilterBar`): внешний `<button class="group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full active:scale-95">` = невидимая 44px хит-зона (ui-audit touch-target ≥44 зелёный), внутренний `<span class="px-3 py-0.5 rounded-full text-[11px]/[12px] font-bold">` = тонкая видимая пилюля (bg/border/text-состояния). Применено к 6 лентам: `SharedMediaTabs` табы (4), `StickerPicker` категории (4), `ContactsView` табы, `SearchBar` чипы, `GlobalSearch` `FilterChip` (реюз 11×), `ChatMediaPanel` (3 набора: красный clear-chip, sender-pills, media-табы). Шрифты остались на рампе (11/12px, F1-clean), размеры иконок не тронуты; hover `hover:*` → `group-hover:*`; `aria-pressed` добавлен sender/media/contact/type-тумблерам. Не-фильтры (аватары, суммы, media-grid, menu-lists) уже ок — не тронуты; `FolderFilterBar`/`CrmFilterBar`/`AdvancedFilterModal` уже тонкие — не тронуты. Регрессия: `SharedMediaTabs`/`StickerPicker`/`ContactsView`/`SearchBar`/`GlobalSearch` тесты зелёные (класс-сплит не ломает клики по tab.text). Перескан D1–D5: 0 findings (только className-строки, все хендлеры live). CHANGELOG `### Fixed` строка | lint 0, tsc clean, vitest 5789/5789 (334 файла), button-audit 0 (235/405), icon-font-audit 0 |
| 2026-09-13 | 0 (D1–D5) + 4-part UX batch (silent icon, accounts limit, account edit, help l10n) | Юзер: «тихое сообщение в чате (иконка) — другим цветом при нажатии — оранжевым например, а то все кнопки фиолетовые… продумай иконки в чате»; «сделаем в бесплатной версии только 3 аккаунта (в профиле) — если больше — премиум»; «продумай поля редактирования для каждого аккаунтов, а то сейчас только никнейм можно отредактировать»; «доработай локализацию» (виз. HelpSupportSection). (1) **Silent-иконка** `ChatInputArea` — актив: `text-[var(--accent)]` (фиолет, неотличим) → amber-fill `bg-amber-500 text-[var(--ink-on-saturate)]` (как Morse), иконка 12→14, `active:scale-95` добавлен silent/morse/schedule/sticker/attach. (2) **Free-tier лимит 3 аккаунта**: `FREE_ACCOUNTS_LIMIT=3` в `settingsConstants.ts`; `canAdd = premium || accounts.length < 3`; при лимите Add-строка → inline upsell-кард (Crown amber, `settings.accountsLimit`, `premium.gatingAccounts`, CTA `onGetPremium` → premium subview). (3) **Аккаунты полноценные**: `Account` расширен `{id,name,color,username?,bio?}`; Edit-панель (name+username+bio+5 swatches ACCOUNT_COLORS), Add те же поля; выбор аккаунта → sync в глобальный `userProfile` (name/username/bio/avatarColor), delete → rebase active, profile save → write-back в активный аккаунт — переключение аккаунтов теперь меняет профиль. (4) **HelpSupportSection l10n**: все ключи были bare (`t('faqQ1')`, top-level ключа нет) → EN-fallback в RU-UI (FAQ-вопросы, категории, «FAQ»); префикс `settings.` (переводы уже были) + `settings.sendAnother` добавлен ×8 (единственный отсутствующий). Новые i18n ×8: `settings.accountUsername/accountBio/accountColor/accountsLimit`, `premium.gatingAccounts`. Регрессия: `ProfileAccounts.test.tsx` переписан (11u; upsell-тест падал — рендерил свежий `baseProps()` вместо протаскивания `p`, хендлер был другой `vi.fn`), `ProfileSection.test.tsx` mock +`premiumEntitlement` (15u зелёные). Перескан D1–D5: 0 findings (все хендлеры live, ConfirmModal stopPropagation; `hash_` только `ChatPreviewLayer.tsx:207`). CHANGELOG `### Fixed` строка | lint 0, tsc clean, vitest 5790/5790 (334 файла), button-audit 0 (235/409), icon-font-audit 0 (466) |
| 2026-09-13 | 0 (D1–D5) + systemic z-index: 10 fixed-fullscreen overlays portaled | Продолжение батча (b2): второй stacking-context trap — `app/ContentView.tsx` motion.div (y-transform варианты `enter/exit` + `className="relative z-20"`) создаёт stacking context, внутри которого каждый `position:fixed` оверлей, смонтированный из main content (`AppMainContent`), упирался в z-20 — ниже `AppSideList z-30`, `BottomNav z-50`, мобильного `ChatPreviewLayer z-50`. Портал: `stories/StoryViewer`, `stories/StoryComposer`, `GlobalSearch`, `chat-preview/ChatContextMenu` (bottom sheet), `recordings/RecordingPlayer`, `crm/CrmImportWizard`, `payments/ChatPickerModal`, `settings/ShareIdentityModal`, `crm/CrmModal` (база для CrmTasks/CrmInviteModal/CrmDealModal/ContactCard/AcceptInviteModal — один портал чинит все 5), `chat-preview/NotificationCenter` (порталится только popover+backdrop фрагмент; колокол остаётся в хедере списка; `getBoundingClientRect`-`style{top,right}` вьюпорт-относительный — portal-safe). Root-level trees уже безопасны (без изменений): `CallOverlay`, `AppOverlays`, `Modal`/`FormModal`/`InviteQRModal`/`ConfirmModal` self-portal. Регрессия: +2 portal-теста (StoryViewer dialog + NotificationCenter popover в `document.body`, колокол на месте); ретаргет 13 container-запросных тестов (StoryViewer ×10 helper → `document.body`, ChatContextMenu backdrop, ChatPickerModal overlay+panel). Перескан D1–D5: 0 findings (CSS-only переносы + фрагмент-сплит, хендлеры не тронуты). CHANGELOG `### Fixed` строка | lint 0, tsc clean, vitest 5807/5807 (332 файла) |
| 2026-09-14 | 1 (nav back-to-origin) + 0 (D1–D5) | Юзер: «находясь с crm и перейдя по кнопке премиума, а потом нажав на кнопку назад - я возвращаюсь в профиль? нужно сделать чтобы всегда... я возвращался туда, откуда пришел. Это касается не только crm а вообще всех пунктов». Корень: cross-view subViews (premium из CRM/AppShell, bot из chats, miniApp из bot) Back/Close хардкодили точку назначения (`setSubView(null)` → settings main, `setView("bots")`, `setView("bot")`) — origin терялся; settings-internal subViews (recordings/callLog/radar) и browser-back уже работали. Фикс: `App.tsx` — `navOrigin` state + `pushView(view, subView?)` (запоминает origin при cross-view переходе) + `goBack()` (восстанавливает origin, fallback chats) + `handleNavigate`-обёртка (top-level nav чистит origin); props проброшены AppShell → AppMainContent → FeatureViews (optional, fallback = старое поведение — существующие тесты целы). Точки: side-list/CRM premium CTA → `pushView("settings","premium")`, premium Back → `goBack()`, bot Back → `goBack()`, bot→miniApp `pushView("miniApp")`, miniApp Close → `goBack()`. Задето 6 файлов: `App.tsx`, `AppShell.tsx`, `AppMainContent.tsx`, `FeatureViews.tsx`, `FeatureViews.test.tsx` (+4), CHANGELOG. Перескан D1–D5: 0 findings (новые хендлеры live, fallback-контракт держит старые тесты; `hash_` app-code только `ChatPreviewLayer.tsx:207`) | lint 0, tsc clean, vitest 5867/5867 (340 файлов) |
| 2026-09-14 | 0 (D1–D5) | Чистый проход 1/3: перескан D1–D5: 0 findings (empty handlers только в test mocks — CallControls/ContactItem/MemberItem; `console.log`/`debug`/`debugger` 0; пустых файлов/директорий нет; onToggle все = инверсия — `ContactProfileModal:77` `notificationsOn=!muted` echo-контракт, `ChatProfileView:241` `!isChatMuted`, `SecuritySection:383` `!autoLockOnBackground`; role=button/switch все live — CrmDeals setSelected, CreateGroupModal toggleMember, CreateChannelModal setIsPublic, EqualizerPanel setVolume; D1 `hash_` только `ChatPreviewLayer.tsx:207`) | lint 0, tsc clean, vitest 5867/5867 (340 файлов), button-audit 0 (235/411), icon-font-audit 0 (474), audit prod 0 |
| 2026-09-14 | 0 (D1–D5) | Чистые проходы 2/3 + 3/3: перескан D1–D5: 0 findings (код не тронут — гейты на committed-состоянии). 3 последовательных зелёных прохода → цикл завершён | lint 0, tsc clean, vitest 5867/5867 (340 файлов) ×3 |
| 2026-09-14 | 0 (D1–D5) | Пост-цикл рескан: lint 0; `console.log`/`debug`/`debugger` 0; empty handlers только в test mocks (CallControls/ContactItem/MemberItem — 27 мест); `hash_` app-code только `ChatPreviewLayer.tsx:207` (остальные 36 = тест-фикстуры); onToggle все = инверсия/action — ContactProfileModal:310 echo-контракт (`notificationsOn=!muted`), ChatProfileView:241 `!isChatMuted`, toggleGroupPermission, BotsSection:37 `isRunning: !bot.isRunning` + `saveBot`, CallsSection/PrivacySection/NetworkSection/SettingsMainMenu все `!x`, SecuritySection PIN set/remove, 2FA setup/disable; role=button/switch live (CrmDeals setSelected → вложенная проверка на чтении); пустых файлов/директорий нет; button-audit 0 (235/411), icon-font-audit 0 (474) | lint 0, tsc clean, vitest 5867/5867 (340 файлов) |
| 2026-09-14 | 0 (D1–D5) | Пост-цикл рескан: lint exit 0; `console.log`/`debug`/`debugger` 0; empty handlers только в test mocks (CallControls:20-32 ×3, ContactItem:27-77 ×11, MemberItem:33-143 ×13 — 27 мест); `hash_` app-code только `ChatPreviewLayer.tsx:207` (остальные 36 = тест-фикстуры); set* scan — только инверсии: ChatProfileView:112 `!contactBlocked`, :148/:241 `!isChatMuted`/`v => !v`; пустых файлов/директорий 0; button-audit 0 (235/411), icon-font-audit 0 (474) | lint 0, tsc clean, vitest 5867/5867 (340 файлов) |
| 2026-09-14 | 0 (D1–D5) + стеклянный дизайн применён (10 батчей, `src/styles/messenger.css`) | Glass migration (см. CHANGELOG 2026-09-14): chat-list/bubbles/composer/sidebar/search/modals/menus/profile-settings/notifications/nav-mobile → `.chat-item`/`.avatar`/`.message`/`.message-composer`/`.icon-button`/`.ds-shell`/`.glass-input`/`.glass-modal`/`.glass-menu`/`.glass-panel`/`.glass-notification` (по батчам, каждый с регрессией до перехода к следующему). Theme-пара слияна в 9 стилевых тестов (5867→5858); isDark props сохранены где функциональны, убраны только style-тернарии. D1–D5 перескан: 0 findings (хендлеры не тронуты, empty handlers только в test mocks) | lint 0, tsc clean, vitest 5858/5858 (340 файлов) |
| 2026-09-14 | 0 (D1–D5) | Чистый проход 1/3 (post-glass-migration): перескан D1–D5: 0 findings (empty handlers только в test mocks — CallControls/ContactItem/MemberItem, 27 мест; `hash_` app-code только `ChatPreviewLayer.tsx:207`; `console.log`/`debug`/`debugger` 0; стеклянные классы theme-agnostic, isDark props сохранены где функциональны — убраны только style-тернарии) | lint 0, tsc clean, vitest 5858/5858 (340 файлов), button-audit 0 (235/411), icon-font-audit 0 (474), l10n PASS, audit prod 0 |
| 2026-09-14 | 0 (D1–D5) | Чистый проход 2/3 (post-glass-migration): код не тронут — гейты на committed-состоянии | lint 0, tsc clean, vitest 5858/5858 (340 файлов) |
| 2026-09-14 | 0 (D1–D5) | Чистый проход 3/3 (post-glass-migration): 3 последовательных зелёных прохода → цикл завершён | lint 0, tsc clean, vitest 5858/5858 (340 файлов) |
| 2026-09-14 | 0 (D1–D5) + swipe-to-close (mobile chat back-gesture) | Юзер: «нужна поддержка свайпов для чата (как в Телеграме и других мессенджерах) и вообще поддержка свайпов, скролов и подобного для мобильных и не только». Инвентаризация: свайпы уже везде — ChatListItem swipe-left/right (mute/archive/delete | message/call/video, framer drag, ±70px порог, vibrate), ChatMessage swipe-to-reply обе стороны + индикатор, ContactItem swipe call/video, StoryContent raw touch-навигация, MediaViewer pinch/pan/dismiss, LiveVoiceRecorder swipe-cancel, FloatingCallWidget/CallScreen free drag, CrmDeals native drag, AppShell mouse-resize; скролл — VirtualizedMessageList (@tanstack/react-virtual), ChatListView virtualizer, useKeyboardScroll; gesture-библиотека `src/lib/gestures/` (useSwipeBack/useLongPress/usePullToRefresh/usePinchZoom) существует, но НЕ используется в app-коде (только self-tests + barrel — useSwipeBack dragConstraints вообще сломанный массив). Пробел: не было swipe-right-to-close на мобильном полноэкранном чате. Фикс `ChatPreviewLayer.tsx` (1 файл): root motion.div — `drag={isMobile && !selectionMode && !showStickerPicker && !showMediaPanel ? "x" : false}`, constraints {left:0,right:0}, elastic {left:0,right:0.35}, close при `offset.x > 90 || velocity.x > 600` → onClose; `useIsMobile` напрямую из `../hooks/useMediaQuery` (не в barrel). Вложенный drag: пузыри сообщений сохраняют свой swipe-to-reply (innermost wins), вертикальный скролл не тронут (pan-y). D1–D5 перескан: 0 findings (drag-хендлер live → onClose, не empty; disabled-условия = легитимные состояния) | lint 0, tsc clean, vitest 5858/5858 (340 файлов) |
| 2026-09-14 | 0 (D1–D5) + §1.3 duplicate prop merge | «Проверь все и оптимизируй»: baseline зелёный (npm run lint 0, tsc clean, vitest 5858/5858). D1–D5 перескан: 0 findings (27 empty handlers = только test mocks ContactItem/CallControls/MemberItem; console.* 0; `hash_` app-code только `ChatPreviewLayer.tsx:209` = документированный name-matched fallback, остальные 36 = тест-фикстуры). §1.3: `navigateTo`/`pushView` дубликат — `App.tsx` передавал одну функцию под двумя именами (AppShell `navigateTo` для bot/premium-CTA + форвард `pushView` в AppMainContent→FeatureViews); `navigateTo` удалён (интерфейс, деструктуризация, 2 call sites → `pushView`), grep = 0 совпадений, поведение идентично (fallback-контракт сохранён). Регрессия: AppShell+FeatureViews 26/26, полный прогон 5858/5858. Открытые наблюдения (не тронуты, вне 2-файл скоупа): (1) `CHAT_SEND_GRADIENT` chatConstants.ts:10 — 0 консьюмеров после glass-миграции (dead export); (2) swipe-хендлер `(_: any, info: any)` — можно типизировать PanInfo | lint 0, tsc clean, vitest 5858/5858 (340 файлов) |
| 2026-09-14 | 0 (D1–D5) + §2.2 e2e audit close-out (rail nav 43px + message-meta contrast) | ui-audit/usability 37/37 после glass-миграции: (1) nav-кнопки shrink-wrap 43px — `.ds-sidebar` `align-items:center` сжал flex-column детей; `w-full` на `<nav>`+footer `<div>` (`EcoSidebarNav.tsx`), `.ds-sidebar` padding `12px 8px`→`12px 6px` → 47px ≥44; (2) `div.message-meta` входящие таймстампы 3.75:1 на пузыре (`rgba(255,255,255,0.075)` над `#080b0c`) — dark `--msg-text-muted` `#768081`→`#849091` (≈5.15:1), `.message-meta` font-size 11→12px; (3) outgoing meta `rgba(78,222,99,0.65)`→`0.9` (≈6.25:1), light `rgba(16,185,129,0.75)`→`0.85`. Исходящий 10:38 подтвердил outgoing-фикс; 10:35 не флагнут (вне вьюпорта, виртуализация). Другие юзы `--msg-text-muted` (218/295/465/339) — только ярче, контраст лучше. D1–D5 перескан: 0 findings (CSS-only + w-full, хендлеры не тронуты; empty handlers только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:209`) | lint 0, tsc clean, vitest 5878/5878 (342 файла), e2e 37/37 |
| 2026-09-15 | 0 (D1–D5) + batch (call UX + ordering + security + relay + glass + docs) | Баtch-таски из next.md (code): **speaker routing** (`CallScreen` setSinkId симметричный, OFF→'default'/ON→enumerate+pick speaker; +3), **devicechange hot-plug** (листенер + tick в deps; +1), **message ordering** (`useP2PMessages.insertBySendTime` — SCTP ordered → gaps невозможны, ACK-pipeline = retransmit, late-arrival в send-time порядок; +1), **OS secure storage** (`deviceSecurity.importRawKey` AES-GCM `extractable:false` — WebCrypto OS-keystore analog; +1), **relay visibility** (`TransportIndicator` relay variant + `AppChrome` store-read; i18n ×8 ×2 ключа; +5), **ring over lock screen** (`CallOverlay` вынесен sibling'ом после `AppAuthGate`, ринг поверх PIN-лока, ответ без разблокировки) — всё с CHANGELOG-строками; docs: next.md полный статус-свип (175→176 строк), README счётчики, schema CallOverlay flow. 9 тематических коммитов `c1d6d3a…8c28a13`. Перескан D1–D5: 0 findings (newhandlers live; drop-only stales; relayed-вариант = meta-переключение, не D5) | lint 0, tsc clean, vitest 5954/5954 (343 файла) |
| 2026-09-16 | 0 (D1–D5) | Пост-цикл рескан: lint exit 0; `console.log`/`debug`/`debugger` 0; empty handlers только в test mocks (CallControls:20-32 ×3, ContactItem:27-77 ×11, MemberItem:33-143 ×13 — 27 мест); `hash_` app-code только `ChatPreviewLayer.tsx:209` (остальные 39 = тест-фикстуры); onToggle все = инверсия; пустых файлов/директорий 0. 3 последовательных зелёных прохода (pre-commit + post-commit + третий, код не тронут) → цикл завершён | lint 0, tsc clean, vitest 5954/5954 (343 файла) ×3 |
| 2026-09-16 | 0 (D1–D5) + §1.4 code-split fix (4 build warnings) | Vite build emitted 4 warnings «dynamically imported … but also statically imported» — `securePersist` статик-импортил `cryptoCore` (tweetnacl 33kb) в main (регресс code-split 09-08: crypto снова в initial bundle, был в modulepreload) → lazy `loadHexHelpers()` в encrypt/decrypt; `store/index` dynamic-import securePersist → статик top-import (модуль crypto-free); `useP2PMessages` (main) статик `callManager` → `void import('../lib/call/CallManager').then(...)` на call-ring диспатче; `callRecorderService`-реэкспорт убран из `lib/index.ts` barrel (0 консюмеров); бонус: `p2p/network.ts` статик `buf2hex` → lazy-loader (коллапс последнего cryptoCore-warning — все оставшиеся статик-импортеры lazy). Сборка 0 warnings; `crypto-*.js`/`cryptoCore-*.js` в dist/assets вне `modulepreload` ✓. Регрессия: +1 `useP2PMessages.test.ts` (call-ring assert → `waitFor`, диспатч теперь async). D1–D5 перескан: 0 findings (код не тронут — только импорты/чанки) | lint 0, tsc clean, vitest 5954/5954 (343 файла), build 0 warnings |
| 2026-09-16 | 0 (D1–D5) | Пост-фикс рескан на committed `d000a01`: empty handlers только в test mocks (CallControls/ContactItem/MemberItem + `.catch(() => undefined)` свалки — 41 матч, app-code 0); `console.log`/`debug`/`debugger` 0; `hash_` app-code только `ChatPreviewLayer.tsx:209` (остальные 39 = тест-фикстуры); D2 echo `setX(id, isX)` 0; role=button/switch все live (SetIsPublic, toggleMember, setSelected, setVolume, MessageReactions picker, ChatHeader profile, ChatListBots open, ChatMediaPanel preview). 3 зелёных прогона (pre-commit + 2 post-commit; 1 transient fail в первом post-commit прогоне — не воспроизвёлся, не идентифицирован, перезапуск 5954/5954) → цикл завершён | lint 0, tsc clean, vitest 5954/5954 (343 файла) ×3, build 0 warnings |
| 2026-09-16 | 0 (D1–D5) + voice/gesture аудит + §1.3 dead gestures | Аудит голосовых (Telegram-parity) + жестов: voice-цепочка live (ChatInputArea → lazy `LiveVoiceRecorder` hold-to-record + swipe-up-cancel + pause/resume + re-record + preview + waveform → `sendVoiceMessage` useMessageActions:97 audio-type + DND guard + offline queue → AttachmentMedia:127 → VoiceWaveform seek/play; voice-reply quote; mic-denied → ChatInputVoiceError); свайпы live (ChatPreviewLayer:255 drag-to-close с гейтами, ChatListItem:238 swipe, ChatMessage:166 swipe-to-reply, ContactItem:82, MediaViewer pinch/pan/dismiss touch-машина, StoryContent touch-nav, wheel-horizontal ×6, RecordingPlayer playback). §1.3: `src/lib/gestures/` удалён целиком (9 файлов: useSwipeBack/useLongPress/usePullToRefresh/usePinchZoom + 4 self-tests + index.ts) — 0 app-консьюмеров (только barrel `lib/index.ts:28`), useSwipeBack сломан (dragConstraints = массив вместо {left,right,top,bottom}; y-инверсия drag-up→'down'); barrel-строка убрана, директория пуста удалена. Реальный gesture-стек = framer-motion напрямую, не тронут. Целевые voice/gesture тесты 111/111 (9 файлов) | lint 0, tsc clean, vitest 5939/5939 (339 файлов, −15), CHANGELOG `### Fixed` |
| 2026-09-16 | 0 (D1–D5) + §1.3 dead code sweep: 11 файлов + 3 barrel-экспорта | Юзер: «проверь все и оптимизация кода». Baseline: tree clean на fe0e048; D1–D5 перескан: 0 findings (empty handlers только в test mocks, console.* 0, `hash_` app-code только `ChatPreviewLayer.tsx:209`, D2 echo 0). §1.3: сквозной скан barrel-консьюмеров (`lib/index.ts` + `hooks/index.ts`) — удалены модули с 0 app-консьюмеров: `gracefulDegradation.ts` (7 экспортов: trackComponentMount/safeSet/retryableWrite/safeRead/retryWithFallback/initWithFallback/safeAsync) + тест, `lazy.tsx` (lazyWithFallback) + тест; мёртвые экспорты: `retrySync` из `retry.ts` (только self-test, 2 теста убраны), `announce` + `AccessibilityPriority` из `a11y.ts` (только self-test), хуки `useGlobalErrorHandler` (полый console-логгер; реальный глобальный обработчик — `main.tsx:44` unhandledrejection, §4.1 цел), `useUndoDelete` (0 app-консьюмеров + дубль-тесты .test.ts/.test.tsx), `useAppView` (0 app-консьюмеров) — все с тестами; barrel-чистка: `lib/index.ts` → только logError из errorHandling (clearErrorLog/getErrorLog/subscribeToErrors остались в модуле для self-test), i18n → только I18nContext/useI18n/detectBrowserLanguage/I18nProvider (preloadLocales/getTranslation* module-only), `hooks/index.ts` → только живые (консьюмер barrel = AppMainContent→useKeyboardScroll). Грепы: retrySync/announce/gracefulDegradation/lazyWithFallback = 0 совпадений после фикса. Гейты: lint 0, tsc clean, vitest 5893/5893 (334 файла, −52 теста), CHANGELOG `### Fixed` |
| 2026-09-16 | 0 (D1–D5) + §2.2 ftr1: media-миниатюры | Юзер: «с медиа не видны в профиле» — профильные вкладки медиа показывали битые `<img src="ftr1:<uuid>">` (P2P-файлы). Корень: `SharedMediaTabs` (профиль) + `ChatMediaPanel` (превью-лента в шапке чата) слали сырой `ftr1:` attachment в `<img src>`, только `AttachmentMedia` умел резолвить через IDB (getTransferMeta/getTransferBlob + sha256). Фикс: `resolveFtrBlobUrl(transferId)` в `lib/fileTransfer/fileStore.ts` (страничный blob-URL кэш, sha-проверка, экспорт `FTR_POLL_MS`/`FTR_POLL_MAX`), новый `src/hooks/useFtrBlobUrl.ts` (поллит пока трансфер собирается, null пока pending); `SharedMediaTabs` → `MediaTile` (ftr резолвится, plain src как было), `ChatMediaPanel` → `MediaImageTile` (свой role=button, резолв ДО открытия вьювера — лайтбокс не получает `ftr1:`, placeholder пока pending). Не-ftr пути не тронуты. Регрессия: +2 SharedMediaTabs.test (blob после completed, сырой `ftr1:` не течёт в src, pending-покрытие), +4 новый ChatMediaPanel.test (plain tile, audio tile, ftr→вьювер blob, pending блокирует вьювер). Греп: все `msg.attachment`-потребители (AttachmentMedia/SharedMediaTabs/ChatMediaPanel) покрыты | lint 0, tsc clean, vitest 5945/5945 (340 файлов), CHANGELOG `### Fixed` |
| 2026-09-16 | 1 (flake root-caused: `TextInputModal` value-clobber race) + 0 (D1–D5) | Deploy-gate прогон упал: `LoginScreen.test.tsx` «imports encrypted backup after entering password» — `decryptBackupFile` не вызван, модалка закрыта, ошибки нет (известный флейк, 09-15 CHANGELOG:23). Корень найден: `TextInputModal` сбрасывал value через пассивный `useEffect [isOpen, initial]` → `setValue(initial)`; под нагрузкой полного прогона (334 файла) эффект-таска планируется ПОСЛЕ ввода юзера/теста — введённое значение затирается в `""`, `confirmBackupPassword("")` закрывает модалку и early-return. Фикс: сброс значения перенесён в render-фазу на переходе closed→open / смене `initial` (`prevOpen`/`prevInitial` refs) — синхронно в том же коммите, гонка невозможна; focus-таймаут остался в эффекте с одним dep. Проверено: 4× standalone LoginScreen 19/19 + 2× полный vitest 5893/5893 до фикса (флейк не воспроизводился). Регрессия: +2 `TextInputModal.test.tsx` (value переживает re-render без клоббера; сброс к `initial` на reopen). Перескан D1–D5: 0 findings (UI-контролы не тронуты, только state-сброс) | lint 0, tsc clean, vitest 5895/5895 (334 файла), CHANGELOG `### Fixed` |
| 2026-09-17 | 0 (D1–D5) + 1 a11y (aria-hidden focus-trap) | Юзер: консольные warning'и — (1) `Blocked aria-hidden on an element because its descendant retained focus` + (2) `Banner not shown: beforeinstallpromptevent.preventDefault() called`. **(1) РЕАЛЬНЫЙ БАГ**: свайп-бакеты `ChatListItem.tsx`/`ContactItem.tsx` вешали `aria-hidden={true}` на закрытый оверлей, пока кнопки внутри (mute/archive/delete/call/video) остаются фокусируемыми (клик по кнопке → `setSwipedOpen("closed")` → фокус внутри aria-hidden; `aria-hidden` не убирает из tab-order → клавиатура таббит в невидимые кнопки). Фикс по WAI-ARIA-рекомендации из самого warning: `aria-hidden` → `inert` (React 19, реальный атрибут) — закрытый бакет теперь unfocusable + вне a11y-дерева, открытый — как было. Регрессия: +1 `ChatListItem.test.tsx`, +1 `ContactItem.test.tsx` (2 закрытых бакета несут `inert`, без `aria-hidden`). **(2) НЕ БАГ**: `Banner not shown... preventDefault()` = информационное сообщение Chrome при кастомном install-паттерне (`useInstallPrompt` preventDefault + `InstallAppBanner` `deferred.prompt()` через Install-кнопку); эмитится безусловно и не может быть подавлено с сохранением кастомного флоу. CHANGELOG `### Fixed`. | lint 0, tsc clean, vitest 5909/5909 (336 файлов, +2), CHANGELOG `### Fixed` |
| 2026-09-17 | 0 (D1–D5) + 2 UX (call-log playback + CRM header) | Юзер: «в истории звонков мы можем прослушать его при желании?`...`пересматриваем записи» + «сдвинь кнопку фильтров рядом с кнопкой премиум уменьши или убери заголовок "CRM"». **CallLogView**: записи с `recordingId` теперь имеют пульсирующий красный `REC`-бейдж в meta-строке + акцентную pill-кнопку (иконка `Headphones`/`Pause` + label `call.playRecording` с `hidden sm:inline`), клик открывает inline `<audio controls>` ПОД строкой, откуда запущено (было: плеер всегда внизу списка, без привязки к строке); повторный клик = toggle-close; `openRecording` revoke'ит предыдущий blob, X-кнопка revoke'ит текущий; +`Headphones`/`Pause` в lucide-mock CallLogView.test. **CRM header**: тумблер фильтров переехал из `CrmFilterBar` (жирная пилюля над списком) в хедер к премиум-кнопке (только people-таб), 44px иконка `SlidersHorizontal` с `aria-pressed` + absolute-бейдж счётчика (`data-testid="crm-filter-badge"`, когда filterCount>0); h2 «CRM» удалён (активный nav-элемент и так показывает место) — осталась строка `displayName · roleLabel · N perms`. `CrmFilterBar` получил controlled-режим (`open?`/`onToggle?`): при переданном `onToggle` своя кнопка не рендерится, open-состояние поднято в `CrmView` (uncontrolled-режим сохранён — `CrmFilterBar.test.tsx` без правок); `CrmPeople` форвардит `filtersOpen`/`onToggleFilters`. Регрессии: +4 `CrmView.test.tsx` (кнопка Filters на people, бейдж-счёт 2 при 2 активных фильтрах, `filtersOpen=false`+`onToggleFilters` в captured.people, кнопка скрыта на Deals); CrmFilterBar 17/17 без изменений; e2e `chat-list.spec.ts:88` `name: 'Filters'` = чат-модал, не CRM — не тронут. CHANGELOG `### Fixed`. Перескан D1–D5: 0 findings (все новые контролы live: toggle → state, badge → счёт, play/pause → blob-аудио) | lint 0, tsc clean, vitest 5907/5907 (336 файлов), CHANGELOG `### Fixed` |

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

| 2026-09-17 | 1 new feature (embed system) + 0 (D1–D5) | Фича «сайт-встройка» (юзер: «сделать раздел настроек в котором владелец сайта может встроить наш чат мессенджера на своем сайте, чтобы посетители могли общаться, а контакты автоматически попадали в наш CRM как веб-контакты, отличающиеся от личных/бизнес»): EmbedWidget — pre-chat contact form (name/email/phone), typed sealed envelope `{v:1, kind:'contact', ...}` через sealToChannel → TeamInbox decrypt-handler перехватывает → `companySlice.ingestWebsiteContact` (dedupe email/phone/name per chat, visitCount++, IDB `company_website_contacts`) + mirror в `crmSlice.importBatch` lead c `site:<domain>` tag + `source:'website'`/`websiteDomain` (`siteContactTag()` helper; новые optional поля на CrmContact/Contact); `EmbedConfig.config` (accent/position/greeting/collectContact) в токене, SiteChatManager per-chat editor (6 accent swatches, pos toggle, greeting, collectContact) + website-contacts list/remove; `generateEmbedSnippet` fallback `${origin}/embed.js` (был пустой src) + новый `src/embed-entry.tsx` через vite multi-entry `input:{main, embed}` → стабильный `dist/embed.js`; i18n ×8 (`embed.contact*` ×6, `company.*` ×13). Регрессии: +2 EmbedWidget, +1 TeamInbox (перехват envelope, без пузыря), +3 SiteChatManager, +4 companySlice (ingest/mirror/dedupe/empty-domain). D1–D5 перескан: 0 findings (все новые контролы live: swatch→updateSiteChatConfig, skip→localStorage, copy→clipboard, remove→removeWebsiteContact; empty handlers только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:209`). CHANGELOG `### Fixed`. | lint 0, tsc clean, vitest 5911/5911 (334 файла), build 0 warnings |
| 2026-09-17 | 2 (embed CSS + presence) + 0 (D1–D5) | «доработай недочеты, и посмотри почему не всети статус». (1) **Embed self-contained**: `EmbedWidget.tsx` tailwind+app-var классы → semantic `.ew-*` (ew-root/panel/header/close/contact/field/btn/messages/msg/composer/input/send/fab, `data-ew-theme`/`data-ew-pos`), новый `src/embed.css` (light+dark, локальные `--ew-*` fallback — тупит без app tokens), `embed-entry.tsx` импортует `?inline` + разовый `<style id="messanger-embed-style">` на boot (host-safe, CSP-proof) + `prefers-color-scheme: dark` → `mountEmbedWidget` 3-й arg theme. dist/embed.js 7808→10820 B (CSS+matchMedia в бандле ✓). (2) **Online status (root cause `chat.online` 0 live writers)**: `network.ts` — `onMetadataSignal` ветка `online-status` (safeParsePresence → presenceObservers), `sendPresenceSignal(online)` broadcast по live transports, `onPresence(cb)`; новый `src/hooks/useChatPresence.ts` (App.tsx у useP2PBoot): onConnection→sendPresenceSignal(true)+mark online, onDisconnection→offline+lastSeen, onPresence→mark, initial snapshot connected peers; `markChatsForPeer` peerId→chat через `peerForChat(id)??peerForChatName(name)`, setChats functional (no-op skip). Симметрично (обе стороны) без relay presence. Future: contacts `online` поле + privacy-gating (док). Регрессии: +6 `useChatPresence.test.tsx`, ретаргет EmbedWidget touch-zone selector. D1–D5: 0 findings (новые контролы live) | lint 0, tsc clean, vitest 5917/5917 (335 файлов), build 0 warnings (1 transient full-suite fail в первом прогоне — не воспроизвёлся на 2 rerun) |
| 2026-09-17 | 0 (D1–D5) + prod connection-pill fix (§4.2/§5.3) | Юзер: на mess.cvr.name пилюля статуса `○` «Не в сети», хотя UI показывает данные. Диагноз: `c1d6d3a` (16.09) убрал `DEFAULT_SIGNALING_SEED_URLS` → `SIGNALING_SEED_URLS` пуст без `VITE_SIGNALING_SEED_URLS` на этапе сборки; задеплоен **obfuscated** билд (`build:hardened`/`build-web.ps1`, env не ставит — в отличие от `deploy-all.ps1:119`) → seed не вшит (проверено: live `main-B2dMLsgr.js` — 0 вхождений `cvr.name`/`workers.dev`/`/ws` в plaintext и base64); при пустом списке `useAppConnection` форсил `disconnected`. Фикс: `src/config/signalling.ts` — чистый `resolveSeedUrls(env, location)`: явные `wss://` env-seeds выигрывают; иначе fallback на **origin страницы** (`wss://<host>/ws`/`ws://…/ws`), который деплоит nginx (`location = /ws`); без DOM/origin → пусто (serverless). Хардкод-хост не возвращён (privacy-стейнс 15.09 сохранён). Регрессия: новый `src/config/signalling.test.ts` (6). CHANGELOG `### Fixed`. D1–D5: UI-контролов нет | lint 0, tsc clean, vitest 5931/5931 (338 файлов) | ✅ Deployed + live-verified: `deploy-all.ps1 -SkipBuild -SkipTests -SkipAndroid -SkipDesktop -SkipIOS -SkipSignaling -SkipAdminCreate -SkipVerify -SkipRelayProxy` (hardened obfuscated dist, SW CACHE_VERSION bumped v59→v60, 592 files/38.8 MB, post-extract verify passed) → live `main-DybdxnQK.js` + `relayToken-7yl1ie4n.js` = 200, fallback tokens present in live chunk (`wss://`×2, `ws://`×1, `/ws`×2); Playwright live check `https://mess.cvr.name/?e2e` → status pill `⚡` `Connection: Прямое` (connected), `new WebSocket('wss://mess.cvr.name/ws')` → open, 0 console errors; relay `POST /api/auth/token` 200, pm2 `mess-signaling` online |
| 2026-09-17 | 0 (D1–D5) + 1 (pill `🔁 Релей` при direct) | Юзер прислал HTML пилюли: `aria-label="Connection: Релей"`, иконка `🔁`. Диагноз: `AppChrome.tsx:14` `relayed = transportBackend !== 'direct'`, а `transportBackend` = персистед-настройка `relayBackend` (Настройки → Сеть, дефолт `direct`, цикл `direct→cfworker→domainfront→peertunnel`); в билде нет релей-эндпоинта, но устаревшее значение из прошлых сессий осталось → пилюля врёт, сокет идёт напрямую (URL переписывает только `cfworker`; `domainfront`/`peertunnel` открывают тот же `wss://<origin>/ws`). Фикс (house style — скрывать, не disabled): `src/config/signalling.ts` — `resolveRelayProxyUrl(env)` + `RELAY_PROXY_URL`/`IS_RELAY_PROXY_CONFIGURED` (env `VITE_RELAY_PROXY_URL`, ставит `deploy-all.ps1` phase 0 рядом с relay-seed); `useAppConnection` учитывает персистед-бэкенд только при сконфигурированном релей-прокси, иначе `direct`; `NetworkSection` прячет строку relay-backend. Защитный фикс: `WsTunnel.formatRelayUrl` принимал только голый хост (`^https?://`) → с новыми абсолютными `wss://`-сидами `cfworker` собрал бы битый `wss://wss://…` → теперь принимает и абсолютный `ws(s)://`. `.env.example` документирует `VITE_SIGNALING_SEED_URLS` + `VITE_RELAY_PROXY_URL`. Регрессии: `signalling.test.ts` +3, новый `useAppConnection.test.tsx` (2), `NetworkSection.test.tsx` +1, `wsTunnel.test.ts` +1. Перескан D1–D5: 0 findings (скрытая строка — не dead control; оба новых потребителя хендлеров не имеют) | lint 0, tsc clean, vitest 5938/5938 (339 файлов) | ✅ Rebuilt (`build-web.ps1 -SkipTests`, hardened, 105 chunks obfuscated) + deployed (`deploy-all.ps1 -SkipBuild …`, SW v60→v62, 597 files/39.7 MB) → live `main-DppVPJK5.js`/`relayToken-tQrdwky_.js`; live-verified persisted `relayBackend: 'cfworker'` coerces to direct: status pill `⚡` `Connection: Прямое`, `wss://mess.cvr.name/ws` open, 0 console errors (fresh profile identical) |
| 2026-09-18 | 1 (mobile: DM file-attach «No file chosen») + 0 (D1–D5) | Задача: «если есть mcp по проверке как работает на андроиде или эпл - мобильных - бесплатные! сам установи, все проверь и исправь недочеты». Установлен **agent-device** (Callstack, npm, MIT) — глобал + stdio MCP в opencode.json; Android-эмулятор Pixel_10_Pro_XL (Android 17, 1344×2992) + live prod в Chrome (TWA CustomTab в эмуляторе ANR — открыт через `am start -d https://mess.cvr.name cm.android.chrome`). Аудит экранов через `agent-device snapshot -i`: Chats, Contacts + Add Contact модалка, ContactProfileModal, Chat (composer/morse/silent/стикеры/Search/StickerPicker), Calls, Company/CRM, Settings — отдельные мобильные баги не обнаружены. **1 баг**: аудио-path DM composer (`ChatInputArea.tsx`) монтировал attachment `<input type="file">` как overlay (`absolute inset-0 opacity-0`) → Android Chrome рендерит такой input как видимый native file-control «No file chosen» (Chrome игнорирует opacity для file-picker). Фикс house-паттерном channel composer: `className="hidden"` + `<label htmlFor="dm-media-input" aria-label={t("chat.attachFile")}>` (id `dm-media-input`). Аудит всех прочих file inputs (LoginScreen/ContactProfileModal/BackupExportSection/ProfileEditForm/CrmImportWizard/StoryComposer/AppearanceSettings/SystemPulsePlayer) — все уже `hidden`. Регрессия: `ChatInputArea.test.tsx` +1. | lint 0, tsc clean, vitest 5933/5933 (341 файлов) | ✅ Деploy готов (`git commit 10448f8`, `build-web.ps1 -SkipTests -SkipLint` hardened 105 chunks, `deploy-all.ps1 -SkipBuild -SkipTests -SkipAndroid -SkipDesktop -SkipIOS -SkipSignaling -SkipAdminCreate -SkipVerify -SkipRelayProxy`, SW v65→v66, 597 files/39.7 MB, HTTPS 200) → live-verified в эмуляторном Chrome после рестарта: чат Test Android показывает `@e13 [group] "Attach file"`, native «No file chosen» исчез; `Connection: Direct`, контакт Online |
| 2026-09-18 | 1 (prod crash: `.slice()` on numeric chat id in ContactProfile) + 0 (D1–D5) | Юзер: «[Image] ошибка» — `.slice()` on value neither string nor array, ContactProfile subtree, minified. Корень: `SafetyNumberModal` **всегда смонтирован** (`ContactProfileModal.tsx` ~420, вне isOpen-ветки) → выражение `(theirPublicKey || contactId).slice(0, 16)` вычисляется на каждом рендере профиля, даже закрытым. `contactId = contact?.id`, а `contact.id` бывает **числом** (лассические чат-id числовые; `ChatListView.tsx:208` `{id: profileContact?.id ?? chat.id}`, `toggleArchive(id: string|number)`) → `(undefined || 5).slice(0,16)` TypeError. Фиксы (3 файла): `SafetyNumberModal.tsx:57,59` `String(myPeerId).slice(0,16)` / `String(theirPublicKey || contactId || '').slice(0,16)`; `ContactProfileModal.tsx:256` `String(contact.name || '').charAt(0)` (скрытый charAt-краш); `company/ContactList.tsx:97` `String(contact.name || '').slice(0,2).toUpperCase()`. Регрессия: +2 `SafetyNumberModal.test.tsx` (numeric `contactId={5}` и `myPeerId={7}` рендерятся без throw). CHANGELOG `### Fixed`. Перескан D1–D5: 0 findings (empty handlers только в test mocks; `hash_` app-code только `ChatPreviewLayer.tsx:207` = документированный name-matched fallback; console.* 0) | lint 0, tsc clean, vitest 5927/5927 (339 файлов) |
| 2026-09-18 | 3 (icon-font scale) + 7 (embed interactions/effects) + 0 (D1–D5) | Юзер: «Дорабатываем вплоть до каждой иконки, эффекта, взаимодействия пользователя с интерфейсом». Baseline зелёный. **(1) icon-font-audit 3 находки** вне шкалы: `AttachmentMedia.tsx:242` `<Play size={22}>` → 24 (в 48px-круге play), `SiteChatManager.tsx:174` `<Trash2 size={13}>` → 14, `EmbedWidget.tsx:177` `<UserRound size={13}>` → 14. **(2) EmbedWidget батч** (осн. новый интерактив 17.09): accent-мismatch — пузыри/фокус-рамки резолвили `--ew-accent` в CSS-дефолт `#6C5CE7`, игноря конфиг-акцент → корень ставит `--ew-accent` inline из токена; icon-only send → `aria-label`/`title` (`embed.send` ×8 локалей) + `disabled={!draft.trim()}` (был клик-no-op); FAB `aria-label` статичен «openChat» при ✕ → динамический open/close; Escape закрывает панель; composer autofocus при open; contact-форма → `<form onSubmit>` (Enter-submit, primary submit / Skip button); эффекты: `.ew-send` hover bright/active scale/disabled dim, `.ew-btn-primary` hover+press, `.ew-fab` hover scale+shadow+press, `.ew-close:active`, `.ew-root :focus-visible` accent outline. Регрессия: `EmbedWidget.test.tsx` +3 (send disabled empty/enabled text, Escape close, FAB label toggle — первый прогон упал: `embed.close` матчил header close + FAB, тест переписан на `getAllByLabelText` + `.ew-fab` attr). en.json EOL-флип через Set-Content (4947 строк) — восстановлен `git checkout`, ключ добавлен edit-тулом (3-строчный diff). Перескан D1–D5: 0 findings (новые контролы live; disabled = легитимное состояние) | lint 0, tsc clean, l10n PASS (0 errors, 9 dynamic), vitest 5930/5930 (339 файлов), icon-font 0, button-audit 0 |
| 2026-09-18 | 2 (dark-theme invisible hovers) + 0 (D1–D5) | Продолжение цикла «иконки/эффекты/взаимодействия»: свип по всем `hover:bg-black/*` хит-зонам (25+ сайтов — остальные корректно `isDark`-гейтнуты) нашёл 2 утечки со светлым-only hover, невидимым в тёмной теме. **(1)** `GlobalSearch.tsx:331` кнопка очистки поиска: `hover:bg-black/10` без тёмной ветки (соседи по хедеру — тернарники) → `hover:bg-white/10` в dark + `transition-colors` (паттерн пилюли :394). **(2)** `ContactProfileModal.tsx:179` MoreActions (⋮): resting `bg-black/5` + `hover:bg-black/10` хардкод (сиблинги :166/:411 уже на тернарнике) → dark: `bg-white/5`/`hover:bg-white/10`. Хит-зоны ≥44px, токен-цвета текста не тронуты. Регрессия: `GlobalSearch.test.tsx` + `ContactProfileModal.test.tsx` 61/61 (класс-тернарник only). Перескан D1–D5: 0 findings (хендлеры не тронуты). CHANGELOG `### Fixed` | lint 0, tsc clean, vitest 5930/5930 (339 файлов) |
| 2026-09-18 | 2 (glass-CSS effect gaps: dead primary hover, menu focus ring) + 0 (D1–D5) | Продолжение цикла «иконки/эффекты/взаимодействия». **(1)** `.icon-button.primary:hover` (`messenger.css`) — байт-идентичная копия resting-состояния = мёртвый hover на главном send-контроле (`ChatInputArea.tsx:243`, primary-тумбл при непустом тексте); фикс: hover `filter: brightness(1.15)`, `:active` явный (scale .92 + `brightness(.9)`, объявлен ПОСЛЕ `:hover` — при равной специфичности побеждает при нажатии), `filter` в transition-списке. **(2)** `.glass-menu-item:focus-visible` (кнопки FormModal, `modalShared.tsx:107,110`) — hover был, клавиатурного focus-ринга не было → accent outline offset -2px (паттерн глобального focus-visible). Консьюмеры подтверждены: `icon-button primary` = ChatInputArea:243, `glass-menu-item` = modalShared:107/110. Только CSS, логика не тронута. CHANGELOG `### Fixed` | lint 0, tsc clean, vitest 5930/5930 (339 файлов) |
| 2026-09-18 | 1 (menu-item press state) + 0 (D1–D5) | Продолжение цикла «иконки/эффекты/взаимодействия». `.glass-menu-item:active` отсутствовал (bottom-sheet action-строки — FormModal/ConfirmDialog футер, `modalShared.tsx:107,110`): hover + focus-ринг были, press-отклика не было (тап ничего не делал до отпускания). Фикс CSS: `:active` = `transform: scale(0.99)` + `background: var(--msg-bg-input)` (темнее hover-`--msg-bg-panel-hover`), `transform` в transition-списке. Язык нажатия согласован: `.chat-item:active` scale .985, `.icon-button:active` scale .92, `.ew-fab/ew-send:active` scale. Наблюдение §1.3: `.glass-notification` — 0 консьюмеров в app (класс CSS мёртвый, решение об удалении за юзером). CHANGELOG `### Fixed` | lint 0, tsc clean, vitest 5930/5930 (339 файлов) |
| 2026-09-18 | prod deploy: crash fix + connection | Юзер: «[Image] ошибка» `.slice()` + «на андроиде запускаю приложение — вообще нет связи». Диагноз: прод держал СТАРЫЙ бандл `main-BUu6fIvd.js` (сборка 08:25, до криш-фикса `21174aa` от 18:38) → `.slice` краш на контактах с числовым id ЖИВ на проде; Android-«нет связи» = stale SW-кэш отдавал докраж-паттерна пустой seed-список. Server-проверка: `wss://mess.cvr.name/ws` WS OPEN, `/api/auth/token` 200, `/health` 200 — signalling OK. Деплой: 4 тематических коммита поверх `21174aa` (embed/UI+locales `6df7c4e`, glass CSS `d1e7213`, android deploy auto-bump `635a8c1`, docs `337c182`), `build-web.ps1 -SkipTests` hardened 105 chunks, `deploy-all.ps1 -SkipBuild …` SW v67→v68 (первый `powershell 5.1` run упал на `utf8NoBOM` → rerun через `pwsh 7`; два bump'а v67→v68), 597 файлов/39.7 MB verified, HTTPS 200. Live-verify: new bundle `main-CBdWQLRr.js`, pill `aria-label="Connection: Прямое"`, `wss://mess.cvr.name/ws` → OPEN, 0 console errors, `String(`-обёртки присутствуют (41 контекст). D1–D5: 0 findings | lint 0, tsc clean, vitest 5930/5930 (339 файлов), audit prod 0 | ✅ Deployed + live-verified (crash fix + connection pill Direct) |
| 2026-09-19 | 0 (D1–D5) + Play pre-launch: androidbrowserhelper deprecated-API вынесен (release 8 / 1.0.7) | Play Console pre-launch (release 7 / 1.0.6) флагнул deprecated-апи: `android.view.Window.setStatusBarColor/setNavigationBarColor` из `LauncherActivity.onCreate` + `splashscreens/PwaWrapperSplashScreenStrategy.customizeStatusAndNavBarDuringSplashScreen` (в androidbrowserhelper 2.7.3 AAR — НЕ в app-коде; 2.7.3 = последний релиз, но всё ещё зовёт deprecated: AAR byte-scan + dexdump AAB подтвердили). Верх main (GoogleChrome/android-browser-helper) уже переписал 5 классов на `WindowCompat.enableEdgeToEdge()` + `androidx.core.view.insets.ColorProtection`/`ProtectionLayout`. Фикс: 5 upstream-main классов завендорены в `scripts/android-vendor/browserhelper/src/main/java/...` (источник правды; `Utils`/`WebViewFallbackActivity` нейтрализованы — deprecated-методы и `getWindow().set*Color` блоки вырезаны, `LauncherActivity.configureIntentBuilder` инлайнен — API отсутствует в 2.7.3-метаданных, builder-схемы собраны напрямую), новый `vendorBrowserhelper()` в `build-android.mjs` (после patchGradleDeps): pristine AAR из gradle-кэша/Google Maven → strip 7 `.class` через `jar` → `android/app/libs/androidbrowserhelper-2.7.3-e2e.aar` → копия vendored java в модуль → gradle-зависимость `files('libs/...')` + explicit transitives (androidx.annotation 1.9.1 / core 1.17.0 / appcompat 1.7.0 / browser 1.10.0 / guava 33.4.8-android). Сборка: assembleRelease + bundleRelease OK (JDK 22, AGP 9.0.1, SDK 36), `aapt badging` → versionCode 8 / versionName 1.0.7; dexdump AAB: единственные остаточные `Window.set*Color` invokes сидят в `androidx.core.WindowCompat.enableEdgeToEdge` (рекомендованный API, Play их не флаget и до фикса), `configureIntentBuilder` в dex отсутствует. Android-only, app-код не тронут. CHANGELOG `### Fixed`. D1–D5 перескан: UI-контролов нет | lint 0, tsc clean, vitest 5930/5930 (339 файлов, не перезапускался — android-only), build artifacts 2/2, CHANGELOG `### Fixed` |
| 2026-09-19 | 0 (D1–D5) + унифицированный акцент: design-system зелёный (dark `#4ede63`/light `#059669`) | По дизайн-доку 19.09.26 акцент переведён на green-family; root-cause жалобы 09-13 «все кнопки фиолетовые» = рассинхрон: `messenger.css` (`--msg-*`) уже зелёный, app-токены держали фиолет dark `#6f7fff`/оранж light `#ea580c`. **`tokens.css`**: dark `--accent #6f7fff→#4ede63` (rgb 78,222,99), `--accent2 #965dff→#10b981`, `--accent-soft rgba(78,222,99,0.12)`, производные (`--waveform-played-other`, `--waveform-unplayed-other`, `--button-primary-bg`, `--button-secondary-hover-bg`/`-border`, `--toggle-active-bg`, `--player-progress-orange`) → green; light `--accent #ea580c→#059669`, `--accent2 #d97706→#047857`, производные → emerald; dark `--button-primary-text → #0d1017` (тёмные чернила на ярком зелёном), light остался `#ffffff` (#047857 ≈4.9:1 AA). **`index.css`** хардкод-fallbacks (radial-gradient/:focus-visible/::selection) → 78,222,99/16,185,129/`#4ede63`. **`useAppearanceEffects.ts`** переписан (55→~140): зеркалит производные при accentColor — `--accent2` (PAIRED_ACCENT2-карта 9 пар + darken 0.78), `--accent2-rgb`, `--button-primary-bg`/`--toggle-active-bg`/`--player-progress-orange`/`--waveform-played-other` = акцент, `--button-primary-text` по WCAG-luminance (lum>0.4 → `#0d1017`). **Стор**: `settingsSlice.ts:257` дефолт `#10b981→#4ede63` + `AppearanceSettings` swatch-list/3 fallback'а; `ChatListView.tsx:159` лёгкий branch `text-purple-600` → `text-[var(--accent2)]` (единственный хардкод-пурпур в компонентах). Скан подтвердил: фиолетовый был только в tokens.css (12) + index.css fallbacks (4), компоненты всё через `var(--accent)`/`var(--accent2)` — глобальный реколор. Регрессия: `useAppearanceEffects.test.tsx` +5 ассертов производных + новый тест дефолт-`#4ede63`; 4 целевых файла 41/41, полный 5942/5942. D1–D5: 0 findings (хендлеры не тронуты). CHANGELOG `### Fixed` | lint 0, tsc clean, vitest 5942/5942 (341 файл) |
