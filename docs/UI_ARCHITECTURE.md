# UI Architecture — Mess&Anger

## 1. Структура интерфейса

```
src/
├── components/
│   ├── ui/                  # Атомарные компоненты (Button, Skeleton, EmptyState, SearchInput...)
│   ├── chat-preview/        # ChatListItem, ChatMessage, ChatInputArea, AvatarRow...
│   ├── navigation/          # SidebarNav, BottomNav, NavItemButton, FluidNav...
│   ├── settings/            # Секции настроек (Appearance, Privacy, Security...)
│   ├── call/                # Звонки, Dialpad, CallScreen...
│   ├── resilience/          # ErrorBoundary, SafeRender
│   └── landing/             # React-компоненты для лендинга (Hero, Features, CTA...)
├── styles/
│   ├── tokens.css           # CSS custom properties (цвета, типографика, токены)
│   ├── tokens.ts            # TypeScript-версия токенов
│   └── index.css            # Глобальные стили, scrollbar, utilities
├── lib/
│   ├── i18n.tsx             # Интернационализация
│   ├── errorHandling.ts     # Глобальная обработка ошибок
│   └── performance.ts       # Метрики Core Web Vitals
└── App.tsx                  # Роутинг между View
```

## 2. Навигация

### Desktop / Tablet
- **SidebarNav**: вертикальная навигация с иконками + лейблами.
- Активный пункт: `bg-orange-500/15 text-orange-400` (dark) / `bg-orange-500/10 text-orange-600` (light).
- Hover: `hover:bg-white/[0.04]` (dark) / `hover:bg-black/[0.03]` (light).

### Mobile
- **BottomNav**: 4 вкладки (Chats, Contacts, Settings, Calls).
- Анимация активного индикатора: `layoutId="bottomNavActive"` (Motion).
- Бейдж: `min-w-[14px] h-3.5 px-1 rounded-full` с shadow.

### Landing
- Fixed top nav: `nav` + `nav.s` (scroll).
- Mobile: hamburger → slide-out panel (`mobile-nav`).

## 3. Views и роутинг

`App.tsx` управляет `activeView`:

| View | Компонент | Описание |
|------|-----------|----------|
| `chats` | ChatListView | Список чатов, папки, поиск |
| `contacts` | ContactsView | Контакты, сортировка, QR-сканер |
| `settings` | SettingsView | Секции настроек через Suspense |
| `calls` | CallLogView | История звонков, фильтры |

## 4. State Management

- **Zustand** (`src/store/`): глобальное состояние (тема, язык, настройки, контакты, чаты).
- **Local state** (`useState`): UI-состояния внутри компонентов (модалы, скролл, swipe).
- **URL state**: отсутствует (SPA без роутера).

## 5. Data Flow

```
User Action
    ↓
Component (onClick/onChange)
    ↓
Zustand action / local setState
    ↓
Re-render
    ↓
Persistence (localStorage / IndexedDB / better-sqlite3)
```

## 6. Адаптивность

| Breakpoint | Ширина | Изменения |
|------------|--------|-----------|
| `sm` | 640px | Увеличенные touch targets, скрыты некоторые декоративные элементы |
| `md` | 768px | Sidebar → Bottom nav на мобильных |
| `lg` | 1024px | Полный desktop layout |
| `xl` | 1280px | Максимальная ширина контента |

## 7. Состояния интерфейса

| Состояние | Реализация |
|-----------|------------|
| **Loading** | `Suspense` + `Skeleton`, `animate-spin` |
| **Empty** | `EmptyState` с иконкой + текстом + опциональным действием |
| **Error** | `ErrorBoundary` с fallback UI + кнопкой retry |
| **Offline** | Offline banner + Service Worker кэширование |

## 8. Безопасность UI

- **XSS**: все пользовательские строки рендерятся через `textContent` или sanitized HTML.
- **CSP**: landing имеет строгую CSP, app — через Vite SPA.
- **Secrets**: нет хардкода ключей/токенов в UI-компонентах.
- **Accessibility**: все интерактивные элементы имеют `aria-label`, фокус виден, поддерживается клавиатурная навигация.

## 9. Производительность

- **Lazy loading**: `React.lazy` + `Suspense` для тяжелых секций настроек.
- **Code splitting**: по route/views через Vite.
- **Images**: `loading="lazy"`, `decoding="async"`, WebP где возможно.
- **Core Web Vitals**: LCP, FID, CLS отслеживаются через `PerformanceObserver`.
