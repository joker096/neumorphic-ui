# MessAnger --- Custom Authentication & Security UI Implementation Specification

## 0. Назначение документа

Этот документ предназначен **не для дизайнера, а непосредственно для
AI-кодинг-агента**, который должен внести изменения в существующий
мессенджер.

Цель: реализовать полноценную систему кастомных экранов авторизации,
PIN-кода, биометрии, OTP, блокировки приложения, защищённых действий и
связанных состояний, визуально ориентированную на предоставленный
UI-kit: светлая и тёмная версии, много воздуха, округлённые карточки,
яркий синий primary-action, крупная центральная иконография, минимальный
текст, нижняя фиксированная CTA-кнопка.

Важно: внешний экран приложения может быть полностью кастомным, но
**реальная биометрическая проверка должна выполняться системным
механизмом устройства**. Приложение не должно получать, хранить или
обрабатывать изображения отпечатков/лица.

------------------------------------------------------------------------

# 1. Главный принцип реализации

## 1.1. Разделить UI и Security Layer

Не смешивать:

1.  `Auth UI` --- визуальные экраны.
2.  `Auth State Machine` --- состояние процесса.
3.  `Biometric Adapter` --- работа с системной биометрией.
4.  `Secure Storage` --- хранение токенов/ключей/PIN-derived secrets.
5.  `Session Manager` --- сессии и устройства.
6.  `WebAuthn/Passkey Adapter` --- для web/PWA.
7.  `Native Biometric Adapter` --- для Android/iOS, если есть native
    shell.

Архитектура:

``` text
UI
 │
 ▼
Auth State Machine
 │
 ├── Password / OTP
 ├── PIN
 ├── Biometric
 ├── Passkey / WebAuthn
 └── Device Session
 │
 ▼
Security Adapter
 │
 ├── WebAuthn
 ├── Android BiometricPrompt
 └── iOS LocalAuthentication
 │
 ▼
Secure Storage
 │
 ▼
Session / API
```

------------------------------------------------------------------------

# 2. Критически важное ограничение биометрии

## Нельзя делать

Нельзя реализовывать настоящий fingerprint scanner через JavaScript/CSS.

Нельзя:

-   получать изображение отпечатка;
-   хранить fingerprint template;
-   сравнивать отпечатки самостоятельно;
-   имитировать успешную биометрию и считать это настоящей авторизацией;
-   хранить биометрические данные в IndexedDB/localStorage;
-   отправлять биометрические данные на сервер.

На iOS LocalAuthentication работает через системный механизм, а
приложение получает только результат проверки. Apple отдельно указывает,
что приложение не получает исходные данные отпечатка и что они находятся
под контролем Secure Enclave. Android аналогично предоставляет системный
BiometricPrompt.

Для web/PWA правильный путь --- **WebAuthn / Passkeys**. Браузер
взаимодействует с platform authenticator, которым может быть
fingerprint, Face ID, Windows Hello и т. п. Сервер хранит публичный
ключ, а не биометрические данные.

------------------------------------------------------------------------

# 3. Как реализовать именно такой кастомный экран

Референсный экран вида:

``` text
┌──────────────────────────────┐
│  09:41                 ▪ ▪   │
│                              │
│          ←                   │
│                              │
│          [ FINGERPRINT ]     │
│                              │
│       Set Your Fingerprint   │
│                              │
│  Add a fingerprint to make   │
│  your account more secure    │
│                              │
│                              │
│             ◉                │
│          fingerprint         │
│          animation           │
│                              │
│                              │
│                              │
│  ┌────────┐  ┌────────────┐  │
│  │  Skip  │  │  Continue  │  │
│  └────────┘  └────────────┘  │
└──────────────────────────────┘
```

должен быть **визуальной оболочкой вокруг реальной системной операции**.

Правильный flow:

``` text
CustomBiometricIntro
       │
       ▼
CheckBiometricAvailability
       │
       ├── unavailable ─────► Fallback / Skip
       │
       ▼
CustomBiometricReady
       │
       ▼
InvokeNativeBiometric / WebAuthn
       │
       ├── success ─────► CustomBiometricSuccess
       │
       ├── cancel ──────► CustomBiometricCancelled
       │
       ├── failed ──────► CustomBiometricFailed
       │
       └── locked ──────► CustomFallback
```

------------------------------------------------------------------------

# 4. Web/PWA вариант --- приоритетный, если MessAnger остаётся web-приложением

Если приложение работает в браузере, нельзя обещать пользователю
настоящий «сканер отпечатка» напрямую.

Использовать:

``` text
WebAuthn
+
Platform Authenticator
+
Passkeys
```

Это позволяет использовать:

-   Touch ID;
-   Face ID;
-   Windows Hello;
-   Android biometric authenticator;
-   аппаратные security keys.

WebAuthn должен использовать HTTPS и корректный RP ID/domain.

Пример архитектуры:

``` text
Frontend
POST /api/auth/webauthn/register/options
        │
        ▼
navigator.credentials.create()
        │
        ▼
Platform Authenticator
        │
        ▼
credential
        │
        ▼
POST /api/auth/webauthn/register/verify
        │
        ▼
Server stores public key
```

Авторизация:

``` text
POST /api/auth/webauthn/login/options
        │
        ▼
navigator.credentials.get()
        │
        ▼
Platform Authenticator
        │
        ▼
assertion
        │
        ▼
POST /api/auth/webauthn/login/verify
        │
        ▼
Session established
```

Сервер **никогда не получает fingerprint**.

------------------------------------------------------------------------

# 5. Native Android

Если MessAnger имеет Android-приложение или Capacitor/React
Native/native bridge:

использовать:

``` text
AndroidX Biometric
BiometricPrompt
BiometricManager
```

Не использовать устаревший `FingerprintManager`.

Рекомендуемый flow:

``` text
BiometricManager
      │
      ├── BIOMETRIC_SUCCESS
      │
      ▼
BiometricPrompt
      │
      ├── success
      ├── user cancelled
      ├── authentication failed
      ├── no hardware
      ├── none enrolled
      └── lockout
```

Поддерживать:

-   fingerprint;
-   face unlock;
-   device credential;
-   сильную биометрию согласно возможностям устройства.

Не писать UI, который утверждает «Fingerprint», если устройство
использует Face Unlock.

Использовать динамический label:

``` text
Touch ID / Fingerprint
Face ID
Biometric authentication
Device authentication
```

------------------------------------------------------------------------

# 6. Native iOS

Использовать:

``` text
LocalAuthentication
LAContext
LABiometryType
```

Определять:

``` text
.faceID
.touchID
.opticID
.none
```

Перед запуском authentication проверить доступность.

Логика:

``` text
LAContext
   │
   ├── canEvaluatePolicy
   │
   ├── biometryType
   │
   ▼
Custom UI
   │
   ▼
evaluatePolicy
   │
   ├── success
   ├── userCancel
   ├── authenticationFailed
   ├── biometryNotAvailable
   ├── biometryNotEnrolled
   ├── biometryLockout
   └── passcode fallback
```

Для Face ID обязательно добавить соответствующее описание использования
в `Info.plist`.

------------------------------------------------------------------------

# 7. Экранная система

Создать отдельный модуль:

``` text
src/
  features/
    auth/
      screens/
      components/
      state/
      services/
      adapters/
      hooks/
      types/
      animations/
      tokens/
```

Рекомендуемая структура:

``` text
auth/
├── screens/
│   ├── SplashScreen
│   ├── WelcomeScreen
│   ├── LoginScreen
│   ├── CreateAccountScreen
│   ├── OTPVerificationScreen
│   ├── ProfileSetupScreen
│   ├── CreatePinScreen
│   ├── ConfirmPinScreen
│   ├── BiometricIntroScreen
│   ├── BiometricScanningScreen
│   ├── BiometricSuccessScreen
│   ├── BiometricErrorScreen
│   ├── AppLockScreen
│   └── SecuritySettingsScreen
│
├── components/
│   ├── AuthHeader
│   ├── AuthLogo
│   ├── AuthIllustration
│   ├── PrimaryButton
│   ├── SecondaryButton
│   ├── PinInput
│   ├── OtpInput
│   ├── BiometricIcon
│   ├── BiometricPulse
│   ├── SuccessAnimation
│   ├── ErrorAnimation
│   ├── SecurityBadge
│   └── AuthFooter
│
├── state/
│   ├── authMachine
│   └── authStore
│
├── services/
│   ├── authApi
│   ├── sessionManager
│   ├── biometricService
│   └── secureStorage
│
└── adapters/
    ├── webAuthn
    ├── androidBiometric
    └── iosBiometric
```

------------------------------------------------------------------------

# 8. Обязательные экраны

## A. Splash Screen

Назначение:

-   загрузка приложения;
-   проверка session;
-   проверка lock state;
-   восстановление защищённой сессии.

Композиция:

``` text
background
     ↓
center logo
     ↓
subtle animated particles
     ↓
small loading indicator
```

Не делать долгую анимацию.

Target:

``` text
300–1200 ms
```

Если состояние уже известно --- переходить сразу.

------------------------------------------------------------------------

# 9. Welcome Screen

Стиль референса:

-   большой logo/mascot;
-   несколько avatar bubbles;
-   короткий headline;
-   короткий subtitle;
-   одна основная CTA.

Пример:

``` text
Welcome to MessAnger

A secure place to chat with
friends, teams and communities.

[ Get Started ]
```

Дополнительно:

``` text
Log in
Create account
Continue with passkey
```

------------------------------------------------------------------------

# 10. Login Screen

Состав:

``` text
←

MessAnger logo

Login to your account

Phone / Email

Remember me

[ Sign in ]

Forgot password?

Don't have an account?
Create account
```

Input должен иметь:

-   icon;
-   focus state;
-   error state;
-   success state;
-   disabled state;
-   loading state.

------------------------------------------------------------------------

# 11. Create Account Screen

Состав:

``` text
←

Create New Account

Phone / Email

Remember me

[ Sign up ]

Already have an account?
Sign in
```

Не перегружать экран.

------------------------------------------------------------------------

# 12. OTP Verification

Использовать 4--6 digit input.

Состояния:

``` text
empty
typing
complete
checking
success
wrong
expired
locked
```

Визуально:

``` text
[ 7 ] [ 4 ] [ _ ] [ _ ]

Resend code in 53 s

[ Verify ]
```

После заполнения всех цифр:

``` text
auto-submit = optional
```

Лучше оставить небольшую задержку только для визуального feedback.

------------------------------------------------------------------------

# 13. Profile Setup

Экран:

``` text
Fill Your Profile

        [ avatar ]
          ✎

Full Name
Username
About
Email
Phone

[ Continue ]
```

Avatar upload:

``` text
tap avatar
   ↓
bottom sheet
   ├── Camera
   ├── Gallery
   ├── Remove
   └── Cancel
```

------------------------------------------------------------------------

# 14. PIN Setup

Нужны два отдельных экрана:

``` text
Create New PIN
Confirm New PIN
```

Не показывать PIN открытым.

Ввод:

``` text
● ● ● 7
```

Анимация:

-   active dot;
-   filled dot;
-   shake при ошибке;
-   success pulse.

Не хранить обычный PIN в localStorage.

------------------------------------------------------------------------

# 15. Biometric Intro Screen

Это главный экран из референса.

## Визуальная структура

``` text
Safe area
│
├── back button
│
├── title
│
├── subtitle
│
├── large biometric illustration
│
├── explanation
│
└── bottom actions
      ├── Skip
      └── Continue
```

### Для fingerprint

``` text
Set Your Fingerprint

Add a fingerprint to make
your account more secure.
```

### Для Face ID

``` text
Set Up Face ID

Use Face ID to unlock
MessAnger faster.
```

### Универсально

``` text
Enable Biometric Unlock

Use your device's biometric
authentication to protect MessAnger.
```

------------------------------------------------------------------------

# 16. Biometric animation

Сделать собственную animation layer.

Компонент:

``` text
<BiometricAnimation
   type="fingerprint"
   state="idle"
/>
```

Состояния:

``` text
idle
ready
scanning
processing
success
failed
locked
```

## Idle

Fingerprint:

``` text
opacity: 0.45
scale: 0.96
```

## Ready

``` text
opacity: 1
scale: 1
```

## Scanning

Добавить:

-   pulsing ring;
-   moving scan line;
-   glow;
-   subtle particles.

## Success

``` text
fingerprint
   ↓
checkmark
   ↓
green/primary success ring
```

## Error

``` text
fingerprint
   ↓
shake
   ↓
error icon
```

Не делать бесконечное интенсивное свечение.

------------------------------------------------------------------------

# 17. Важное различие: кастомная анимация ≠ реальная биометрия

AI-agent должен реализовать:

``` ts
await biometricService.authenticate()
```

и только после результата:

``` ts
if (result.success) {
    setState("success")
} else {
    setState("failed")
}
```

Нельзя:

``` ts
setTimeout(() => success(), 2000)
```

для настоящей security operation.

Анимация должна отражать состояние реального вызова API.

------------------------------------------------------------------------

# 18. Biometric Success Screen

Пример:

``` text
        ✓

Biometric Enabled

MessAnger can now be unlocked
with your device authentication.

[ Continue ]
```

Animation:

``` text
ring expands
checkmark appears
small particles
```

После success:

``` text
persist biometric-enabled state
```

Но сохранять не биометрию, а только:

``` text
biometricEnabled: true
credentialId / secure reference
```

в зависимости от платформы.

------------------------------------------------------------------------

# 19. Biometric Failure Screen

Не использовать страшное сообщение.

``` text
Authentication Failed

We couldn't verify your identity.

Try again or use your PIN.

[ Try Again ]

[ Use PIN ]
```

После нескольких ошибок:

``` text
Too many attempts

Use your device passcode/PIN
or try again later.
```

------------------------------------------------------------------------

# 20. App Lock Screen

Это экран, который показывается при возвращении в приложение.

``` text
MessAnger

        🔒

Unlock MessAnger

Use Face ID
or fingerprint to continue.

[ biometric icon ]

Use PIN instead
```

Если WebAuthn:

``` text
Unlock MessAnger

Use your passkey or device
authentication.

[ Unlock ]
```

------------------------------------------------------------------------

# 21. Lock policy

Настройки:

``` text
Immediately
After 15 seconds
After 1 minute
After 5 minutes
After 15 minutes
Never
```

Также:

``` text
Lock when app goes to background
Lock when screen turns off
Lock when switching accounts
```

------------------------------------------------------------------------

# 22. Security Settings

Экран:

``` text
Security

App Lock
    Face ID / Fingerprint      ON

PIN
    Change PIN                 >

Biometric
    Enabled                    >

Active Sessions                >

Two-Step Verification          >

Passkeys                       >

Login Alerts                   >

Security Notifications         >
```

------------------------------------------------------------------------

# 23. Protected Actions

Биометрия должна использоваться не только для входа.

Добавить configurable protection:

``` text
Open Messenger
Open hidden chats
Open archived/private chats
View protected media
Export account data
Export encryption keys
Add new device
Remove device
Change PIN
Disable biometric lock
Change recovery settings
Delete account
```

Для опасных операций использовать step-up authentication:

``` text
action
  ↓
requireAuth(level)
  ↓
biometric
  ↓
PIN fallback
  ↓
perform action
```

------------------------------------------------------------------------

# 24. Authentication Levels

Создать enum:

``` ts
enum AuthLevel {
  NONE,
  SESSION,
  BIOMETRIC,
  PIN,
  STRONG
}
```

Пример:

``` ts
requireAuth(AuthLevel.BIOMETRIC)
```

Для удаления аккаунта:

``` ts
requireAuth(AuthLevel.STRONG)
```

------------------------------------------------------------------------

# 25. Универсальный Auth Modal

Создать reusable component:

``` text
<SecurityChallenge
   reason="delete_account"
   allowedMethods={[
      "biometric",
      "pin"
   ]}
/>
```

Причина должна отображаться человеку:

``` text
Confirm account deletion

Authenticate to continue.
```

Другие:

``` text
Confirm device addition

Confirm changing your PIN

Unlock private chat

View protected media
```

------------------------------------------------------------------------

# 26. Chat UI

После authentication блоков реализовать основной UI в той же design
system.

## Header

``` text
avatar
name
status

search
call
video
more
```

## Message bubbles

Исходящие:

``` text
primary blue
white text
```

Входящие:

``` text
neutral surface
dark text
```

Dark mode:

``` text
dark surface
white/neutral text
blue accent
```

------------------------------------------------------------------------

# 27. Attachment Action Sheet

В референсе используется круговая/модульная action palette.

Реализовать:

``` text
Photo
Camera
Gallery
Document
Location
Contact
Audio
Poll
File
```

Не показывать 10 огромных кнопок.

Лучше:

``` text
bottom sheet
+
2–4 columns
+
icon
+
short label
```

------------------------------------------------------------------------

# 28. Media Viewer

Поддержать:

``` text
image
video
document preview
audio
```

Gestures:

``` text
pinch zoom
double tap
swipe down
swipe left/right
long press
```

Controls скрывать автоматически.

------------------------------------------------------------------------

# 29. Contact Picker

Экран:

``` text
Select Contact

Search

New Group
New Contact

A
Jenny Wilson
Alex Miller
...

B
...
```

Использовать круглые avatars.

Selection:

``` text
tap → checkmark
```

Bottom CTA:

``` text
[ Continue ]
```

------------------------------------------------------------------------

# 30. Profile / Contact Details

Сделать полноценный экран:

``` text
large avatar
name
username
status

Message
Call
Video

Media
Links
Documents

Notifications
Mute
Disappearing messages
Encryption
Shared groups

Block
Report
Delete chat
```

------------------------------------------------------------------------

# 31. Calls

## Outgoing

``` text
avatar

Jenny Wilson

Calling...

[ mute ]
[ speaker ]
[ video ]
[ end ]
```

## Connected

``` text
remote video

small local preview

controls
```

## Incoming

``` text
avatar

Jenny Wilson
Incoming video call

[ decline ]
[ accept ]
```

## Minimized call

Small floating video bubble.

------------------------------------------------------------------------

# 32. Dark Mode

Нужны две полноценные темы.

## Light

Рекомендуемые стартовые tokens:

``` css
--bg: #F5F8FF;
--surface: #FFFFFF;
--surface-soft: #F0F4FB;
--text: #111827;
--text-secondary: #6B7280;
--primary: #2F6BFF;
--primary-hover: #245BE0;
--success: #16C784;
--danger: #EF4444;
--border: rgba(17,24,39,.07);
```

## Dark

``` css
--bg: #17191F;
--surface: #20232A;
--surface-soft: #252932;
--text: #F5F7FA;
--text-secondary: #A4AAB5;
--primary: #2F6BFF;
--primary-hover: #4A7CFF;
--success: #24D17E;
--danger: #FF5A65;
--border: rgba(255,255,255,.06);
```

Это **стартовые значения**, а не утверждение, что они являются точными
пикселями референса.

------------------------------------------------------------------------

# 33. Design Tokens

Создать единый token system.

``` ts
export const tokens = {
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48
  },

  typography: {
    title: 28,
    h2: 22,
    body: 16,
    small: 13,
    caption: 11
  }
}
```

Не использовать десятки случайных значений.

------------------------------------------------------------------------

# 34. Buttons

Primary:

``` text
height: 48–52px
radius: 14–18px
font-weight: 600
```

Secondary:

``` text
height: 48–52px
transparent/soft surface
```

Danger:

``` text
red
```

Ghost:

``` text
no visible container
```

Не делать огромные кнопки на половину экрана.

------------------------------------------------------------------------

# 35. Input fields

Состояния:

``` text
default
hover
focus
filled
error
disabled
success
```

Рекомендация:

``` text
height: 50–56px
radius: 14px
padding: 0 16px
```

Focus:

``` text
primary border
+
soft glow
```

------------------------------------------------------------------------

# 36. Bottom CTA

Для auth screens:

``` text
position: fixed / sticky bottom
padding-bottom: safe-area
```

Структура:

``` text
Skip       Continue
```

или:

``` text
[ Continue ]
```

На маленьком экране CTA не должен перекрываться клавиатурой.

------------------------------------------------------------------------

# 37. Safe Area

Обязательно учитывать:

``` css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

Особенно:

-   iPhone;
-   Android edge-to-edge;
-   PWA;
-   fullscreen mode.

------------------------------------------------------------------------

# 38. Keyboard behavior

Для OTP/PIN:

``` text
inputMode="numeric"
autocomplete="one-time-code"
```

Клавиатура не должна перекрывать CTA.

При открытии keyboard:

``` text
scroll active field into view
```

------------------------------------------------------------------------

# 39. Animation system

Использовать небольшое количество стандартных transition.

``` text
fast: 120ms
normal: 180ms
medium: 260ms
slow: 400ms
```

Easing:

``` text
cubic-bezier(.2,.8,.2,1)
```

Не анимировать всё одновременно.

------------------------------------------------------------------------

# 40. Required animations

Создать:

``` text
fadeIn
fadeOut
slideUp
slideDown
scaleIn
shake
pulse
successRing
errorShake
buttonPress
pageTransition
```

Biometric:

``` text
fingerprintPulse
fingerprintScan
fingerprintSuccess
fingerprintError
```

------------------------------------------------------------------------

# 41. Reduced Motion

Обязательно поддержать:

``` css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```

Не отключать функциональность.

------------------------------------------------------------------------

# 42. Auth State Machine

AI-agent должен создать явную state machine.

Пример:

``` ts
type AuthState =
  | "boot"
  | "welcome"
  | "login"
  | "register"
  | "otp"
  | "profile"
  | "create-pin"
  | "confirm-pin"
  | "biometric-intro"
  | "biometric-auth"
  | "biometric-success"
  | "biometric-error"
  | "app-lock"
  | "authenticated"
  | "locked";
```

Не управлять сложной auth-навигацией набором независимых boolean:

``` ts
isLogin
isOtp
isPin
isBiometric
...
```

Это быстро создаёт невозможные комбинации состояний.

------------------------------------------------------------------------

# 43. Navigation rules

``` text
BOOT
 │
 ├── no account → WELCOME
 │
 ├── account + no session → LOGIN
 │
 ├── session + app locked → APP_LOCK
 │
 └── valid session → HOME
```

Registration:

``` text
REGISTER
 ↓
OTP
 ↓
PROFILE
 ↓
PIN
 ↓
BIOMETRIC
 ↓
HOME
```

Existing user:

``` text
LOGIN
 ↓
OTP/password/passkey
 ↓
optional biometric enrollment
 ↓
HOME
```

------------------------------------------------------------------------

# 44. Security storage

## Web

Не хранить чувствительные secrets в:

``` text
localStorage
sessionStorage
IndexedDB
```

если они позволяют обойти security boundary приложения.

Для WebAuthn:

``` text
server:
credentialId
publicKey
signCount / authenticator data
userId
device metadata
```

Private key остаётся в authenticator.

## Native

Использовать:

``` text
iOS Keychain
Android Keystore
```

или безопасный abstraction layer.

------------------------------------------------------------------------

# 45. PIN Security

Никогда:

``` text
PIN = "1234"
```

в базе.

Использовать:

``` text
salt
+
slow password KDF
+
rate limiting
```

Если PIN используется только для локальной разблокировки,
предпочтительно использовать его для разблокировки локально защищённого
ключа, а не как прямый API credential.

------------------------------------------------------------------------

# 46. Brute-force protection

Для PIN:

``` text
attempt 1–4:
normal

attempt 5:
short delay

attempt 6:
longer delay

many failures:
temporary lock
```

Не показывать точную внутреннюю security policy злоумышленнику через
слишком подробные ошибки.

------------------------------------------------------------------------

# 47. Session Management

Создать:

``` text
DeviceSession {
  id
  deviceName
  platform
  lastActiveAt
  createdAt
  ipApproximation
  userAgent
  current
}
```

UI:

``` text
Active Sessions

This device
MacBook Pro
Active now

iPhone
2 minutes ago

Android
Yesterday

[ Revoke ]
```

------------------------------------------------------------------------

# 48. Login notifications

После нового устройства:

``` text
New login detected

Device: iPhone
Location: approximate
Time: 15:41

[ This was me ]
[ Secure account ]
```

Не раскрывать лишние персональные данные.

------------------------------------------------------------------------

# 49. Protected chat

Для private/hidden chat:

``` text
chat list
  ↓
tap protected chat
  ↓
SecurityChallenge
  ↓
biometric
  ↓
chat opens
```

Если authentication cancelled:

``` text
chat remains locked
```

Не загружать sensitive content в DOM до успешной проверки.

------------------------------------------------------------------------

# 50. Protected media

Не просто скрывать image через CSS.

Плохо:

``` css
display: none;
```

Если файл уже загружен клиенту.

Правильно:

``` text
auth
 ↓
authorize media
 ↓
fetch/decrypt
 ↓
render
```

------------------------------------------------------------------------

# 51. Loading states

Каждый security action должен иметь:

``` text
idle
loading
success
error
cancelled
```

Пример:

``` text
[ Continue ]
      ↓
[ spinner ]
      ↓
[ ✓ ]
```

Не оставлять кнопку активной во время запроса.

------------------------------------------------------------------------

# 52. Error UX

Плохой вариант:

``` text
Error 401
```

Хороший:

``` text
We couldn't verify your identity.

Try again or use your PIN.
```

Техническую ошибку писать в лог, а не показывать пользователю.

------------------------------------------------------------------------

# 53. Accessibility

Обязательно:

-   WCAG contrast;
-   keyboard navigation;
-   visible focus;
-   screen reader labels;
-   `aria-label`;
-   semantic buttons;
-   touch target минимум около 44px;
-   не полагаться только на цвет;
-   ошибки должны иметь текст;
-   OTP/PIN inputs должны быть доступными.

------------------------------------------------------------------------

# 54. Localization

Все тексты вынести:

``` text
i18n/auth/en.json
i18n/auth/ru.json
i18n/auth/ka.json
```

Не писать:

``` tsx
<button>Continue</button>
```

внутри компонентов.

Использовать:

``` tsx
t("auth.biometric.continue")
```

------------------------------------------------------------------------

# 55. Recommended Russian strings

``` text
Set Up Fingerprint
Настроить отпечаток пальца

Enable Biometric Unlock
Включить биометрическую разблокировку

Use your fingerprint to unlock MessAnger.
Используйте отпечаток пальца для разблокировки MessAnger.

Authentication Failed
Не удалось подтвердить личность

Try Again
Попробовать снова

Use PIN
Использовать PIN

Biometric Enabled
Биометрия включена

Skip for Now
Пропустить

Continue
Продолжить
```

------------------------------------------------------------------------

# 56. Component API

## BiometricScreen

``` ts
interface BiometricScreenProps {
  mode: "setup" | "unlock" | "action";
  biometricType: "fingerprint" | "face" | "generic";
  title: string;
  description: string;
  onSuccess: () => void;
  onCancel: () => void;
  fallback: "pin" | "password" | "none";
}
```

## SecurityChallenge

``` ts
interface SecurityChallengeProps {
  reason:
    | "unlock_app"
    | "open_private_chat"
    | "view_protected_media"
    | "add_device"
    | "change_pin"
    | "disable_biometrics"
    | "delete_account";

  minimumLevel: "biometric" | "pin" | "strong";

  onSuccess: () => void;
  onCancel: () => void;
}
```

------------------------------------------------------------------------

# 57. Biometric Service API

Сделать единый interface:

``` ts
interface BiometricService {
  isAvailable(): Promise<boolean>;

  getType(): Promise<
    "fingerprint" |
    "face" |
    "iris" |
    "passkey" |
    "none"
  >;

  authenticate(
    reason: string
  ): Promise<{
    success: boolean;
    cancelled?: boolean;
    locked?: boolean;
    error?: string;
  }>;

  enroll(): Promise<{
    success: boolean;
    error?: string;
  }>;
}
```

Для web adapter:

``` text
authenticate → WebAuthn assertion
```

Для Android:

``` text
authenticate → BiometricPrompt
```

Для iOS:

``` text
authenticate → LAContext
```

------------------------------------------------------------------------

# 58. Не привязывать UI к платформе

Компонент:

``` tsx
<BiometricIcon />
```

сам решает:

``` text
fingerprint → fingerprint SVG
face → face SVG
passkey → passkey icon
generic → security icon
```

Не писать везде:

``` text
Fingerprint
```

------------------------------------------------------------------------

# 59. Fingerprint SVG

Создать собственный vector asset:

``` text
assets/icons/biometric/fingerprint.svg
```

Требования:

-   outline;
-   rounded strokes;
-   scalable;
-   no raster image;
-   no external copyrighted icon;
-   currentColor;
-   animated stroke where supported.

------------------------------------------------------------------------

# 60. Fingerprint animation implementation

SVG можно сделать:

``` text
stroke-dasharray
stroke-dashoffset
opacity
transform
```

Sequence:

``` text
idle
   ↓ 200ms
highlight
   ↓
scan line moves
   ↓
outer ring pulse
   ↓
success
```

Не использовать GIF.

Предпочтительно:

``` text
CSS
SVG
Web Animations API
Framer Motion
React Spring
```

в зависимости от текущего stack.

------------------------------------------------------------------------

# 61. Auth illustrations

Референс использует простые 3D/flat illustrations.

Для MessAnger:

``` text
Welcome
Security
Cloud sync
Messages
Calls
Contacts
Privacy
```

Создать единый illustration language:

-   rounded;
-   friendly;
-   blue primary;
-   white/soft neutral;
-   minimal shadows;
-   no photorealism.

------------------------------------------------------------------------

# 62. Avatar system

Поддержать:

``` text
image
initials
generated avatar
default silhouette
online indicator
verified indicator
```

Sizes:

``` text
24
32
40
48
56
72
96
128
```

------------------------------------------------------------------------

# 63. Responsive rules

Минимум:

``` text
320px
375px
390px
430px
768px
1024px
1280px+
```

Mobile-first.

На desktop auth screen:

``` text
centered mobile-like auth card
```

или полноценный responsive layout.

Не растягивать mobile form на весь desktop width.

------------------------------------------------------------------------

# 64. Desktop auth

Рекомендуемая структура:

``` text
desktop background
        │
        ▼
 centered auth card
        │
  ┌───────────────┐
  │ logo          │
  │ title         │
  │ form          │
  │ CTA           │
  └───────────────┘
```

Максимальная ширина:

``` text
420–460px
```

------------------------------------------------------------------------

# 65. PWA app lock

Для PWA использовать:

``` text
visibilitychange
pagehide
pageshow
blur/focus
```

Но не считать `blur` автоматически доказательством, что приложение нужно
заблокировать.

Хранить:

``` text
lastAuthenticatedAt
lockTimeout
```

и при возврате:

``` text
if elapsed > timeout:
    lock()
```

------------------------------------------------------------------------

# 66. Background handling

При уходе в background:

``` text
redact sensitive UI
```

Например:

``` text
chat messages → blurred placeholder
private images → hidden
```

Это особенно важно для app switcher screenshots.

Native app может дополнительно закрывать/маскировать snapshot.

------------------------------------------------------------------------

# 67. Clipboard protection

Для PIN/OTP:

``` text
do not copy PIN automatically
```

OTP:

``` text
allow OS autofill
```

Но не логировать OTP.

------------------------------------------------------------------------

# 68. Logging

Нельзя:

``` ts
console.log(password)
console.log(pin)
console.log(otp)
console.log(accessToken)
console.log(webauthnCredential)
```

Разрешено:

``` text
AUTH_BIOMETRIC_START
AUTH_BIOMETRIC_SUCCESS
AUTH_BIOMETRIC_CANCELLED
AUTH_BIOMETRIC_FAILED
```

Без секретов.

------------------------------------------------------------------------

# 69. Telemetry

Если используется analytics:

не отправлять:

``` text
phone
email
PIN
OTP
credential
biometric data
private message
```

Можно:

``` text
screen_opened
auth_started
auth_success
auth_failed
```

с обезличенным device/session ID.

------------------------------------------------------------------------

# 70. QA matrix

Проверить:

## Biometric

``` text
fingerprint available
fingerprint unavailable
fingerprint not enrolled
face available
face unavailable
biometric cancelled
biometric failed
biometric locked
device credential fallback
```

## Auth

``` text
correct OTP
wrong OTP
expired OTP
resend OTP
wrong PIN
correct PIN
too many PIN attempts
session expired
logout
re-login
```

## UI

``` text
light
dark
small phone
large phone
tablet
desktop
keyboard open
keyboard closed
safe area
landscape
reduced motion
large text
```

------------------------------------------------------------------------

# 71. Acceptance Criteria

AI-agent не должен считать задачу завершённой, пока не выполнено:

### Authentication

-   [ ] Login screen implemented.
-   [ ] Register screen implemented.
-   [ ] OTP screen implemented.
-   [ ] Profile setup implemented.
-   [ ] PIN creation implemented.
-   [ ] PIN confirmation implemented.
-   [ ] Biometric intro implemented.
-   [ ] Biometric real authentication implemented.
-   [ ] Biometric success implemented.
-   [ ] Biometric error implemented.
-   [ ] PIN fallback implemented.
-   [ ] App lock implemented.
-   [ ] Security settings implemented.

### Security

-   [ ] No raw biometric data is stored.
-   [ ] No PIN in localStorage.
-   [ ] No OTP in logs.
-   [ ] Web uses WebAuthn if biometric-like authentication is required.
-   [ ] Native platforms use their official biometric APIs.
-   [ ] Session revocation works.
-   [ ] Sensitive content is not rendered before authorization.
-   [ ] Brute-force/rate-limit policy exists.

### UX

-   [ ] Light theme.
-   [ ] Dark theme.
-   [ ] Smooth transitions.
-   [ ] Reduced-motion support.
-   [ ] Keyboard handling.
-   [ ] Safe-area handling.
-   [ ] Accessibility labels.
-   [ ] Localization.
-   [ ] Error/loading/success states.

------------------------------------------------------------------------

# 72. AI-agent execution plan

AI-agent должен выполнять задачу строго по этапам.

## Phase 1 --- Audit

Перед изменением кода:

``` text
1. Inspect repository.
2. Detect framework.
3. Detect routing.
4. Detect state management.
5. Detect authentication backend.
6. Detect current session storage.
7. Detect current theme.
8. Detect current mobile/PWA support.
9. Detect native wrappers if any.
10. Locate existing login/register screens.
```

Не переписывать проект целиком без необходимости.

------------------------------------------------------------------------

## Phase 2 --- Design System

Создать:

``` text
tokens
theme
typography
buttons
inputs
cards
icons
animations
safe-area helpers
```

Сначала foundation, потом screens.

------------------------------------------------------------------------

## Phase 3 --- Auth State Machine

Реализовать:

``` text
boot
welcome
login
register
otp
profile
pin
biometric
authenticated
locked
```

------------------------------------------------------------------------

## Phase 4 --- Security adapters

Если web:

``` text
WebAuthn adapter
```

Если Android:

``` text
BiometricPrompt adapter
```

Если iOS:

``` text
LocalAuthentication adapter
```

Если проект hybrid:

``` text
platform adapter
```

------------------------------------------------------------------------

## Phase 5 --- Custom UI

Сделать screens:

``` text
Splash
Welcome
Login
Register
OTP
Profile
Create PIN
Confirm PIN
Biometric Intro
Biometric Scanning
Biometric Success
Biometric Error
App Lock
Security Settings
Sessions
```

------------------------------------------------------------------------

## Phase 6 --- Protected actions

Добавить:

``` text
SecurityChallenge
```

и подключить его к:

``` text
private chat
protected media
device management
security settings
PIN change
account deletion
```

------------------------------------------------------------------------

## Phase 7 --- Main Messenger UI

После auth:

``` text
Chats
Contacts
Groups
Channels
Chat
Attachments
Media Viewer
Calls
Profile
Settings
```

------------------------------------------------------------------------

## Phase 8 --- Dark theme

Каждый экран должен проверяться в:

``` text
Light
Dark
```

Не просто инвертировать цвета.

------------------------------------------------------------------------

## Phase 9 --- QA

Запустить:

``` text
lint
typecheck
unit tests
e2e
mobile viewport tests
auth flow tests
```

------------------------------------------------------------------------

# 73. Визуальная цель

Общий характер интерфейса:

``` text
Clean
Friendly
Secure
Premium
Modern
Minimal
Soft
Fast
```

Основные признаки:

-   много whitespace;
-   крупная центральная иконография;
-   округлые элементы;
-   мягкие shadows;
-   синий primary;
-   нейтральный фон;
-   минимальное количество текста;
-   понятная одна CTA;
-   аккуратные micro-interactions;
-   одинаковые отступы;
-   одинаковые радиусы;
-   одинаковые состояния компонентов.

Не копировать логотип, название, иллюстрации или фирменные assets из
референса. Использовать только общие UX/design patterns и создать
собственную визуальную идентичность MessAnger.

------------------------------------------------------------------------

# 74. Что нельзя делать AI-агенту

1.  Не переписывать весь проект ради UI.
2.  Не удалять существующую auth/backend логику без необходимости.
3.  Не заменять настоящий biometric API fake animation.
4.  Не хранить PIN/OTP/password в localStorage.
5.  Не хранить fingerprint/face data.
6.  Не использовать `setTimeout` как доказательство успешной
    authentication.
7.  Не показывать sensitive content до security check.
8.  Не делать разные независимые auth flags вместо state machine.
9.  Не использовать огромные кнопки, перекрывающие клавиатуру.
10. Не делать только light theme.
11. Не делать только красивый happy path --- обязательны
    error/cancel/locked/fallback states.
12. Не использовать одинаковый текст «Fingerprint» на Face ID
    устройствах.
13. Не ломать существующие маршруты.
14. Не создавать дублирующиеся компоненты кнопок/inputs.
15. Не добавлять секреты в frontend bundle.

------------------------------------------------------------------------

# 75. Definition of Done

Задача считается выполненной только если пользователь может пройти
полный сценарий:

``` text
Open MessAnger
      ↓
Splash
      ↓
Welcome
      ↓
Create account
      ↓
OTP
      ↓
Profile
      ↓
Create PIN
      ↓
Confirm PIN
      ↓
Enable biometric
      ↓
System biometric authentication
      ↓
Custom success screen
      ↓
Messenger
      ↓
Background app
      ↓
App lock
      ↓
Custom unlock screen
      ↓
Real biometric authentication
      ↓
Messenger unlocked
```

И альтернативный сценарий:

``` text
Biometric unavailable
      ↓
PIN fallback
      ↓
Correct PIN
      ↓
Messenger unlocked
```

И ошибочный сценарий:

``` text
Biometric
      ↓
Failure
      ↓
Custom error state
      ↓
Retry
      ↓
Failure
      ↓
Use PIN
```

------------------------------------------------------------------------

# 76. Рекомендуемые технические источники

### Android

Android официально рекомендует `BiometricPrompt` для biometric
authentication; `FingerprintManager` является устаревшим подходом.

https://developer.android.com/identity/sign-in/biometric-auth

### Apple

Apple LocalAuthentication предоставляет Face ID, Touch ID и другие
локальные механизмы, а приложение получает результат проверки, а не
исходные биометрические данные.

https://developer.apple.com/documentation/LocalAuthentication

Apple также предоставляет `LAAuthenticationView` для случаев, когда
требуется встроенная кастомная authentication UI вокруг системной
локальной аутентификации.

https://developer.apple.com/documentation/localauthenticationembeddedui/

### Web / PWA

Для web-приложения использовать WebAuthn/Passkeys.

https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API

https://developer.mozilla.org/en-US/docs/Web/Security/Authentication/Passkeys

------------------------------------------------------------------------

# 77. Итоговая архитектура

``` text
                         MessAnger
                             │
                ┌────────────┴────────────┐
                │                         │
             Auth UI                  Messenger UI
                │                         │
        ┌───────┴────────┐        ┌───────┴────────┐
        │                │        │                │
      Login            Security  Chats            Calls
      OTP              Challenge Contacts         Media
      PIN              App Lock   Groups           Profile
      Biometric                   Channels         Settings
        │
        ▼
    Auth State Machine
        │
        ├───────────────┐
        │               │
      WebAuthn       Native
        │           ┌────┴─────┐
        │        Android      iOS
        │        Biometric    LocalAuth
        │        Prompt       LAContext
        │
        ▼
  Secure Credential / Key
        │
        ▼
    Session Manager
        │
        ▼
      Backend
```

------------------------------------------------------------------------

# 78. Финальная задача для AI-agent

**Не ограничиваться созданием нескольких красивых экранов.**

Нужно реализовать полноценную систему:

``` text
DESIGN SYSTEM
+
AUTH STATE MACHINE
+
CUSTOM AUTH UI
+
REAL BIOMETRIC AUTH
+
WEBAUTHN/PASSKEY
+
PIN FALLBACK
+
APP LOCK
+
PROTECTED ACTIONS
+
SECURE STORAGE
+
SESSION MANAGEMENT
+
LIGHT/DARK THEME
+
ACCESSIBILITY
+
LOCALIZATION
+
RESPONSIVE MOBILE UI
+
ERROR/LOADING/SUCCESS STATES
+
QA
```

Главная цель --- чтобы пользователь воспринимал MessAnger как цельный
коммерческий продукт, а не как набор отдельных страниц.

**Приоритет:** безопасность и корректность authentication \> UX \>
визуальная анимация.

Кастомная анимация должна быть оболочкой над настоящей authentication
operation, а не её заменой.
