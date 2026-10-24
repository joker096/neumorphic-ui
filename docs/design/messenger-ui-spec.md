# ТЗ для ИИ-агента: UI мессенджера (React + TypeScript)

Нужно реализовать мобильный UI мессенджера (в референсе называется «Hichat», название вынеси в конфиг `APP_NAME`). Всего 30 экранов, у каждого есть **светлая и тёмная темы**. Дизайн — чистый, минималистичный, с одним акцентным синим цветом, крупными скруглениями и большим количеством воздуха.

Это UI-прототип: бэкенд не нужен, данные — моки. Логика (навигация, ввод кода, переключение табов, выделение сообщений, меню) должна работать.

---

## 1. Стек и структура

- React 18 + TypeScript (strict), Vite
- Роутинг: `react-router-dom` v6
- Стили: CSS Modules + CSS-переменные для тем (без UI-библиотек)
- Иконки: `lucide-react` (stroke 1.75, размер 20/24)
- Анимации: `framer-motion` (только переходы экранов, bottom sheet, модалка)
- Состояние: `zustand` (тема, auth-flow, чаты)
- Шрифт: **Urbanist** (Google Fonts, веса 400/500/600/700), fallback `Inter, system-ui, sans-serif`
- Viewport: мобильный, макет рассчитан на ширину **375×812**. На десктопе рендерить приложение в рамке-телефоне по центру (max-width 420px, высота 100dvh).

```
src/
  app/            App.tsx, router.tsx, ThemeProvider.tsx
  styles/         tokens.css, global.css
  theme/          tokens.ts
  components/     ui/ (Button, Input, PhoneInput, OtpInput, Keypad, Avatar, Badge,
                  Switch, Tabs, BottomSheet, Modal, DropdownMenu, AppBar, ListItem,
                  ChatBubble, MessageInput, StatusBar, CallControls)
  features/
    onboarding/   Splash, Welcome, LetsYouIn
    auth/         Login, CreateAccount, OtpVerification, FillProfile, CreatePin, Fingerprint
    chats/        ChatList, EmptyChats, SelectContact, Conversation, Camera
    calls/        VoiceCall, VideoCall
    profile/      ContactInfo, SharedMedia
  data/           mock.ts
  types/          index.ts
```

---

## 2. Дизайн-токены

### 2.1 Цвета

| Токен | Light | Dark |
|---|---|---|
| `--primary` | `#2F6BFF` | `#2F6BFF` |
| `--primary-pressed` | `#2459D6` | `#2459D6` |
| `--primary-soft` (фон выбранного, подсветка поля) | `#EAF1FF` | `#1B2A4E` |
| `--bg` (фон экрана) | `#FFFFFF` | `#181A20` |
| `--surface` (инпуты, карточки, входящие пузыри) | `#F5F6F8` | `#232630` |
| `--surface-2` (модалки, меню) | `#FFFFFF` | `#1F222B` |
| `--border` | `#ECEEF2` | `#2C303B` |
| `--text` | `#12151C` | `#FFFFFF` |
| `--text-secondary` | `#7B8394` | `#9AA1B2` |
| `--text-placeholder` | `#A9AFBC` | `#6B7284` |
| `--on-primary` | `#FFFFFF` | `#FFFFFF` |
| `--danger` | `#F04438` | `#F04438` |
| `--success` | `#12B76A` | `#12B76A` |
| `--overlay` | `rgba(0,0,0,.55)` | `rgba(0,0,0,.65)` |

Исходящий пузырь: фон `--primary`, текст белый. Входящий: фон `--surface`, текст `--text`.
AppBar в чатах (список, диалог, профиль) — **сплошной синий** `--primary`, белый текст и иконки, в обеих темах.

### 2.2 Типографика (Urbanist)

| Роль | Размер / вес / line-height |
|---|---|
| Заголовок экрана (H1, «Login to Your Account») | 28 / 700 / 36 |
| Заголовок Welcome | 24 / 700 / 32, цвет `--primary` |
| AppBar title | 18 / 600 / 24 |
| Body | 14 / 500 / 20 |
| Список: имя | 15 / 600 |
| Список: превью сообщения | 13 / 400, `--text-secondary` |
| Caption (время, подписи) | 12 / 500, `--text-secondary` |
| Кнопка | 16 / 600 |
| Цифры клавиатуры | 24 / 600 |

### 2.3 Отступы, радиусы, тени

- Сетка 4px. Горизонтальный padding экрана — **24px**. Вертикальные интервалы между блоками: 16 / 24 / 32.
- Радиусы: поле ввода и кнопка — **12px** (кнопки на auth-экранах — pill `999px`), карточка/модалка — 24px, пузырь сообщения — 16px (угол «хвоста» 4px), аватар — 50%, bottom sheet — 24px сверху.
- Высота кнопки 52px, инпута 52px, ListItem 72px, AppBar 56px (+ статус-бар 44px).
- Тень модалки/меню: `0 8px 32px rgba(15,23,42,.14)` (light), `0 8px 32px rgba(0,0,0,.5)` (dark).
- Карточки/кнопки без обводки, поля — 1px `--border`; активное поле — 1.5px `--primary` + фон `--primary-soft`.

### 2.4 Реализация тем

`tokens.css` объявляет переменные в `:root[data-theme='light']` и `:root[data-theme='dark']`. `ThemeProvider` читает/пишет в `localStorage`, по умолчанию — `prefers-color-scheme`. В Splash/Settings сделать переключатель (временный, в углу dev-панели).

---

## 3. Базовые компоненты (props на TS)

- **Button** `variant: 'primary' | 'secondary' | 'ghost'`, `size`, `fullWidth`, `disabled`, `loading`. Primary — синий фон, белый текст, pill. Secondary — `--primary-soft` фон, синий текст. Disabled — opacity .5. Pressed — `--primary-pressed`, scale .98.
- **Input** с иконкой справа (календарь, почта), label как placeholder, состояния: default / focus / filled / error.
- **PhoneInput** — слева флаг 🇺🇸 + шеврон + разделитель, затем номер `+1 111 467 378 399`. Маска, только цифры.
- **Checkbox «Remember me»** — 20×20, радиус 6, checked = синий фон + белая галочка.
- **Keypad** — сетка 3×4 (1–9, `*`, 0, backspace), без фона у клавиш, цифры 24/600, высота ряда 64px. Снизу home-indicator (134×5 pill).
- **OtpInput** — 4 ячейки 56×56, радиус 12, фон `--surface`; активная — рамка `--primary` и фон `--primary-soft`. Цифры 24/600 по центру.
- **Avatar** `size: 32|40|48|56|120`, поддержка фото / инициалы / placeholder (серый силуэт). Онлайн-точка не нужна.
- **Badge** — синий круг/pill 20px, белая цифра 11/600.
- **Tabs** — 2–3 текстовых таба в синем AppBar; активный — белый текст + белая линия 2px снизу, неактивный — белый с opacity .7.
- **ListItem** — аватар 48 слева, имя + превью, справа время и Badge/галочки.
- **ChatBubble** `direction: 'in'|'out'`, `text`, `time`, `status`, `attachments`, `selected`.
- **MessageInput** — pill-поле `--surface` высотой 48 с placeholder «Type a message...», справа иконки скрепки и камеры, рядом круглая синяя кнопка 48 с микрофоном (при наличии текста — иконка send).
- **BottomSheet**, **Modal**, **DropdownMenu**, **AppBar**, **StatusBar** (фейковая: время `9:41`, иконки сигнала/wifi/батареи).

---

## 4. Роуты

```
/                       Splash (2 сек → /welcome)
/welcome                Welcome
/lets-you-in            LetsYouIn
/login                  Login
/create-account         CreateAccount
/otp                    OtpVerification
/fill-profile           FillProfile
/create-pin             CreatePin
/fingerprint            Fingerprint (+ модалка Congratulations)
/home                   ChatList (табы Chats | Status | Calls; пустое состояние = EmptyChats)
/select-contact         SelectContact
/chat/:id               Conversation
/chat/:id/camera        Camera
/call/:id/voice         VoiceCall
/call/:id/video         VideoCall
/contact/:id            ContactInfo
/contact/:id/media      SharedMedia (табы Media | Links | Documents)
```

Переходы: push — slide справа (250ms ease-out), модалки/sheet — снизу + fade overlay.

---

## 5. Спецификация экранов

Общее для auth-экранов: белый/тёмный фон, контент по центру, логотип 72×72 (синяя «речевая пузырь» с улыбающимся лицом, нарисуй SVG: синий скруглённый пузырь с хвостиком слева-снизу, белые глаза-дуги и белая улыбка-полукруг), кнопка назад `←` слева сверху (24px), статус-бар сверху.

### Блок A. Onboarding

1. **Splash** — логотип 88×88 по центру, вокруг разбросаны синие точки-«конфетти» разных размеров (4–16px, opacity .6–1), под логотипом лоадер из 8 синих точек по кругу (вращение 1с linear infinite). Через 2с автопереход.
2. **Welcome** — верхняя половина: 8–9 круглых фото-аватаров разных размеров (40–72px) в хаотичной «облачной» композиции, часть с цветной подложкой (красная, жёлтая, зелёная). Ниже заголовок «Welcome to Hichat!» (синий, 24/700, по центру), подзаголовок 2 строки (`--text-secondary`, 13px), индикатор страниц из 3 точек (активная — pill 16×6 синяя), кнопка `Get Started` (primary, pill, full width, отступ снизу 32).
3. **Let's you in** — сверху иллюстрация (облако с человеком на ноутбуке, можно упрощённый SVG), заголовок «Let's you in» 28/700. Три outline-кнопки (высота 52, радиус 12, 1px `--border`, иконка соцсети + текст «Continue with Facebook / Google / Apple», текст 14/600). Разделитель «or» (линии по бокам). Primary-кнопка «Sign in with Phone Number». Внизу: «Don't have an account? **Sign up**» (Sign up — синий).

### Блок B. Login / Create account

Состояния (на макете 5 для login и 4 для create):

4. **Login** (пустой): H1 «Login to Your Account», PhoneInput (placeholder «+1 000 000 000»), чекбокс «Remember me», кнопка `Sign in` (disabled-вид, опция opacity .6), внизу «Don't have an account? Sign up».
5. **Login: ввод** — PhoneInput в фокусе (рамка + `--primary-soft`), кнопка `Sign in` активна, снизу выезжает **Keypad** (системная клавиатура не нужна; `inputmode="none"`). Нижние ссылки скрыты.
6. **Login: заполнен** — номер `+1 111 467 378 399`, чекбокс отмечен, кнопка активна, клавиатуры нет.
7. **Create New Account** — идентично Login: H1 «Create New Account», кнопка `Sign up`, ссылка «Already have an account? **Sign in**». Те же 3 состояния (пустое / с Keypad / заполненное). Логотип располагается над H1, отступ 24.

Валидация: номер ≥ 10 цифр → кнопка активна. Submit → `/otp`.

### Блок C. OTP

8. **OTP Code Verification** — AppBar: стрелка назад + заголовок «OTP Code Verification» (слева, 16/600). Текст «Code has been send to +1 111 ******99» (центр). 4 ячейки OtpInput. «Resend code in **55** s» (число синее, таймер 60→0, по нулю — ссылка «Resend»). Кнопка `Verify` внизу (active при 4 цифрах). Два состояния: с Keypad (ячейки заполняются по мере набора) и без Keypad с полным кодом `7 4 5 8`. После Verify → `/fill-profile`.

### Блок D. Профиль и безопасность

9. **Fill Your Profile (пустой)** — AppBar «Fill Your Profile». Аватар-placeholder 120×120 (серый круг с силуэтом) и маленькая синяя круглая кнопка-карандаш 32×32 в правом нижнем углу (белая иконка). Поля: Full Name, Nickname, Date of Birth (иконка календаря), Email (иконка конверта), About. Кнопка `Continue` (disabled-вид).
10. **Fill Your Profile (заполнен)** — фото, значения: «Andrew Ainsley», «Andrew», «12/27/1995», «andrew_ainsley@yourdomain.com», «Always Available :)». Кнопка активна. Date picker — нативный `<input type="date">`.
11. **Create New PIN** — AppBar «Create New PIN». Текст «Add a PIN number to make your account more secure.» 4 ячейки PIN: введённые — чёрные/белые точки «•» (в dark — белые), активная — синяя рамка + цифра. Кнопка `Continue`, Keypad.
12. **Set Your Fingerprint** — AppBar «Set Your Fingerprint». Описание, по центру большая синяя иконка отпечатка пальца (≈160px, stroke), подпись «Please put your finger on the fingerprint scanner to get started». Внизу две кнопки в ряд: `Skip` (secondary) и `Continue` (primary).
13. **Congratulations** — тот же экран затемнён overlay, поверх **Modal**: белая карточка радиус 24, padding 32, иконка профиля в синем круге 80 с синими точками вокруг, заголовок «Congratulations!» (синий, 20/700), текст «Your account is ready to use. You will be redirected to the home page in a few seconds.», внизу loader-точки. Через 3с → `/home`.

### Блок E. Чаты

14. **Welcome (пустые чаты)** — синий AppBar: логотип-иконка + «Hichat» слева, справа иконки поиска и «⋮». Табы: Chats (активный) | Status | Calls. Центр: логотип + конфетти-точки, «Welcome! 👋», текст «Hichat connects you with family and friends. Start chatting now!», кнопка `Start New Chat` (primary) → `/select-contact`.
15. **Chat List** — тот же AppBar + табы (Chats с бейджем «1» рядом с названием). Первая строка «Archived» (иконка архива в синем круге 40 + бейдж справа). Список ListItem: аватар, имя (600), превью, справа время (`20:00`, `Yesterday`, `Dec 20, 2024`) и синий Badge с числом непрочитанных или двойная галочка. Сообщения вроде «Can't wait to try it out!», «Wow, this is really epic 👍». Группы — с градиентными/цветными аватарами. Справа внизу — **FAB** 56×56 синий с иконкой «+»/сообщение (тень), открывает `/select-contact`.
16. **Select Contact** — синий AppBar «Select Contact» + иконка поиска. Две быстрые строки: «New Group» (иконка группы в синем круге), «New Contact» (иконка + QR справа). Далее алфавитный список контактов: аватар 48, имя, под ним номер `+1-300-555-0136`. Тап → `/chat/:id`.

### Блок F. Диалог

17. **Conversation (базовый)** — синий AppBar: ← аватар 32 + «Jenny Wilson», справа иконки видео, телефон, ⋮ (тап на имя → `/contact/:id`). Фон чата — `--bg`. Разделитель даты «Today» (pill `--surface`, 12px). Сообщения: исходящие справа (синие), входящие слева (`--surface`), максимальная ширина 75%, padding 12×14, время 11px внутри пузыря справа снизу + двойная галочка у исходящих (синяя/белая opacity). Группировка: между подряд идущими сообщениями 4px, между разными авторами 12px. Внизу — MessageInput.
18. **Conversation + Keyboard** — в поле набран текст «I'm planning to hang out…», справа вместо микрофона — send. Снизу рисуется QWERTY-клавиатура (имитация iOS: фон `#D1D5DB`/dark `#2B2D33`, клавиши радиус 6, нижний ряд: `123`, пробел, 🙂, микрофон). Допустимо использовать нативную клавиатуру вместо имитации.
19. **Camera** — полноэкранное фото (ресторан), сверху иконка закрытия, снизу по центру большая кнопка-затвор (белое кольцо 72, внутри полупрозрачный круг, синяя обводка), слева — вспышка, справа — переключение камеры. Для прототипа — статичное фото + кнопки; затвор возвращает в чат с фото.
20. **Attachment sheet** — над MessageInput всплывает карточка (радиус 24, `--surface-2`, тень) с сеткой 3×2 круглых иконок 48: Document (оранжевый `#F97316`), Camera (бирюзовый `#14B8A6`), Gallery (фиолетовый `#A855F7`), Audio (бирюзовый-голубой `#06B6D4`), Location (красный `#EF4444`), Contact (синий `#3B82F6`). Под иконкой подпись 12/500. Закрывается тапом вне.
21. **Conversation с медиа/голосовым** — в диалоге появляются: сообщение с текстом «I'm planning to hang out with my old friends while studying at Havana Restaurant, Saturday at 19 pm 😊» и под ним 2 фото в сетке (радиус 12) внутри синего пузыря; и **голосовое сообщение** — play-кнопка, волна (30 столбиков, активные белые, остальные opacity .4), длительность `00:08`. Фото открываются fullscreen по тапу (простой lightbox).
22. **Selection mode** — по long-press сообщение выделяется: на всю ширину строки фон `--primary-soft`. AppBar меняется: ← + счётчик «1» + иконки действий (reply, star, copy, forward, delete). Выход — стрелка назад.
23. **Chat menu** — по «⋮» DropdownMenu справа сверху (ширина 200, радиус 12, `--surface-2`, тень): Search, Mute Notification, Disappearing Messages, Wallpaper, Report, Block, Clear Chat, Export Chat, Add Shortcut. Пункт 14/500, высота 40, иконка слева 18px. Фон чата под меню затемнён слегка.

### Блок G. Звонки

24. **Voice call** — полноэкранное размытое (blur 24px) фото собеседника как фон + тёмный градиент. По центру аватар 120 с цветным ореолом (кольцо `#F97316`), имя «Jenny Wilson» (22/700, белый), под ним таймер «05:46». Снизу 4 круглые кнопки 56: динамик, микрофон, видео (полупрозрачные белые 20%, blur), и красная `End` с телефонной трубкой (`--danger`). Сверху ← и иконка «добавить участника».
25. **Video call** — фон: фото собеседника без блюра на весь экран; в правом нижнем углу PiP 96×128 радиус 16 с собственным превью, бордер белый 2px. Те же кнопки: динамик, камера, микрофон, завершить. Контролы поверх полупрозрачной тёмной панели.

### Блок H. Профиль контакта

26. **Contact Info** — синий AppBar (←, иконки видео, телефон, ⋮). Аватар 88 по центру (на стыке синей шапки и белого фона), имя «Jenny Wilson» 20/700, номер `+1-300-555-0136`. Строка статуса «Always available. Just contact me 😊» и дата «December 12, 2024» (caption). Список настроек (иконка 20 + текст + справа значение/шеврон): Media, Links & Documents `269 >`, Mute Notification (Switch), Custom Notification, Media Visibility, Starred Messages, Disappearing Messages `Off >`, Groups in Common `8 >`. В конце красные пункты: «Report Jenny Wilson», «Block Jenny Wilson» (цвет `--danger`).
27. **Shared Media** — синий AppBar «Jenny Wilson», табы Media | Links | Documents. Media: секции «Recent», «This Week», «Last Month» — заголовок секции 14/600, сетка 3 колонки, gap 4px, квадраты с радиусом 8, фото. Links/Documents — списки (иконка, название, размер/дата).

> Экраны 1–27 покрывают все 30 кадров макета: Login и Create Account имеют по 3 состояния (пустой / с Keypad / заполненный), OTP — 2 состояния, Fingerprint — 2 (с модалкой и без).

---

## 6. Мок-данные (`data/mock.ts`)

```ts
export interface User { id: string; name: string; phone: string; avatar?: string; status?: string }
export interface Message {
  id: string; chatId: string; from: 'me' | string; text?: string; time: string;
  status?: 'sent' | 'delivered' | 'read'; images?: string[];
  voice?: { duration: number; waveform: number[] }
}
export interface Chat {
  id: string; title: string; avatar?: string; lastMessage: string;
  time: string; unread?: number; isGroup?: boolean
}
```

Сделай ≥10 контактов (Jenny Wilson, Aileen Fullbright, Florencio Dorrance, Marci Senter, Sanjuanita Ordonez, Willard Purnell, Hannah Burress, Alfonzo Schuessler, Freida Varnes, Annabel Rohan) и чатов (включая группы «Office Work!», «My Beloved Family ❤️»). Фото — `https://i.pravatar.cc/200?img=N`, картинки в чате — `https://picsum.photos/seed/.../600/400`.

---

## 7. Поведение и доступность

- Все интерактивные элементы ≥ 44×44 hit-area, `:active` состояние с scale .98 и затемнением.
- Фокус клавиатурой: `outline: 2px solid var(--primary)`.
- `aria-label` на иконочных кнопках, `role="dialog"` у модалок, ESC/клик по overlay закрывает.
- Safe-area: `padding-top: env(safe-area-inset-top)` и снизу для home-indicator.
- Автоскролл чата вниз при новом сообщении; отправка добавляет исходящее сообщение в zustand-стор.
- Таймер OTP и автопереходы очищать в `useEffect` cleanup.

## 8. Порядок работы для агента

1. Настроить проект, токены, ThemeProvider, шрифт.
2. Реализовать базовые компоненты из §3 и показать их на временной странице `/kit` в обеих темах.
3. Собрать auth-флоу (экраны 1–13) и проверить навигацию целиком.
4. Собрать чаты, диалог и все его состояния (14–23).
5. Звонки и профиль (24–27).
6. Проверить обе темы на каждом экране, ширину 360 и 414, отсутствие горизонтального скролла, `tsc --noEmit` и ESLint без ошибок.

Критерий готовности: каждый экран визуально совпадает с макетом по сетке, цветам и радиусам, переключение темы мгновенное, весь флоу от Splash до диалога и звонка проходится без ошибок в консоли.
