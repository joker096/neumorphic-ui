# i18n Localization Fix Design

## Problems Identified

1. **zh.json contains Japanese text** instead of Simplified Chinese
2. **Interpolation mismatch**: `t()` uses `{var}` replacement but locale files use `{{var}}` (double braces)
3. **Missing translations** in all non-English locales (many keys fall back to English)
4. **Hardcoded strings** in components bypassing `t()` calls
5. **Insufficient test coverage** for i18n system
6. **Potential XSS** via translation string injection

## Plan

### Phase 1: i18n System Fix
- Fix `t()` in `src/lib/i18n.tsx` to use `{{${k}}}` instead of `{${k}}`
- Update test expectations to match new interpolation output

### Phase 2: Locale File Corrections
- Rewrite `src/locales/zh.json` with proper Simplified Chinese
- Verify `src/locales/ja.json` is correct Japanese
- Translate all English fallbacks in `src/locales/ru.json` (calls, recordings, media, folders, morse, stickers, channel, bot, sound, notifications sections)
- Run key comparison across all locales against en.json, add any missing keys

### Phase 3: Hardcoded String Detection & Fix
- Write analysis script to scan `.tsx` files for string literals that should use `t()`
- Replace found hardcoded strings with proper `t('section.key')` calls
- Add any new i18n keys to all locale files as needed

### Phase 4: Tests
- Expand `src/lib/i18n.test.ts` with comprehensive tests:
  - All `getTranslation` edge cases
  - `getTranslationWithFallback` full coverage
  - Interpolation with both single and multiple args
  - `detectBrowserLanguage` edge cases
  - `preloadLocales` error handling
  - Cross-locale key consistency test
  - XSS injection attempt via args

### Phase 5: Security Review
- Check translation strings for HTML/script injection vectors
- Verify CSP headers in server config
- Check secrets exposure in locale files
- Review localStorage usage for language preference

## Success Criteria
- All tests pass
- No hardcoded user-facing strings in components (except actual data/content)
- All 8 locales have consistent key sets
- zh.json contains Chinese, ja.json contains Japanese
- interpolation produces expected output with double braces consumed
- Security audit reveals no XSS vectors via i18n
