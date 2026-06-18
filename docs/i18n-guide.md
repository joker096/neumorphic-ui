# i18n Guide

## Available Locales

| Code | Language |
|------|----------|
| `en` | English |
| `ru` | Russian |
| `de` | German |
| `es` | Spanish |
| `fr` | French |
| `zh` | Chinese |
| `ja` | Japanese |
| `ko` | Korean |

Locale files live in `src/locales/{lang}.json`.

## Adding New i18n Keys

1. Open `src/locales/en.json` and add your key under the appropriate section:

```json
{
  "mySection": {
    "myKey": "My translated text"
  }
}
```

2. Add the same key to all other locale files with the appropriate translation. If you don't have a translation yet, leave the English text as a placeholder.

3. Keys use dot notation for lookup: `t('mySection.myKey')`.

## Using `t()` in Components

Import and use the `useI18n` hook:

```tsx
import { useI18n } from '@/lib/i18n'

function MyComponent() {
  const { t } = useI18n()
  return <p>{t('mySection.myKey')}</p>
}
```

## Using `useI18n` Hook

The `useI18n` hook returns:

```tsx
const { lang, setLang, t } = useI18n()
```

- `lang` -- current language code (e.g. `'en'`, `'fr'`)
- `setLang(code)` -- switch language; persists to `localStorage` under `app_language` key
- `t(key, args?)` -- translate a key with optional interpolation arguments

Example switching languages:

```tsx
const { lang, setLang } = useI18n()
<button onClick={() => setLang('fr')}>Francais</button>
```

## Interpolation with `{{variable}}`

Locale strings can contain `{{variable}}` placeholders:

```json
{
  "chat": {
    "daysAgo": "{{count}}d ago"
  }
}
```

Pass values as the second argument to `t()`:

```tsx
t('chat.daysAgo', { count: 5 }) // => "{5}d ago"
```

Interpolation works across all locales. Each locale file can define its own template:

```json
// en.json
"minutesAgo": "{{count}}m ago"

// fr.json
"minutesAgo": "il y a {{count}} min"
```

## Fallback System

The translation lookup follows this priority:

1. **Target locale** -- if the key exists in the current language, use it
2. **English fallback** -- if the key is missing in the target locale, use the English value from `en.json`
3. **Raw key** -- if the key doesn't exist in any locale, return the key string itself

This is handled by `getTranslationWithFallback()` and is automatically applied by the `t()` function.

Example: If `fr.json` is missing `settings.recoveryPhrase`, calling `t('settings.recoveryPhrase')` while the language is set to `'fr'` will return `'Recovery Phrase'` from English.

## Preloading

All 8 locale files are preloaded eagerly at app startup via `preloadLocales()` in the app entry point. This prevents flash-of-untranslated-content and makes translations available synchronously throughout the app.
