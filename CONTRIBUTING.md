# Contributing

## Code Style

- TypeScript strict mode
- ESLint + Prettier (single quotes, no semicolons)
- Tailwind utility classes for styling; no CSS modules
- CSS custom properties for all colors (see `src/styles/tokens.css`)

## Component Standards

- **Atomic:** one component = one concern
- **Max 300 lines per component**
- **All colors** must reference CSS variables, never hardcoded hex
- **All text** should be i18n-ready (though not forced for early-stage components)
- **Accessibility:** touch targets ≥44px, `role` attributes, keyboard navigation, `aria-*`

## Pull Request Process

1. `npm run lint` must pass (0 errors, 0 warnings)
2. `npx tsc --noEmit` must pass
3. `npm test` must pass
4. New features should include tests (Vitest + Testing Library)

## State Management

- Use Zustand store (`src/store/index.ts`) for shared state
- Local component state for ephemeral UI state
- Custom hooks for business logic (see `src/hooks/`)

## Security

- No `dangerouslySetInnerHTML` — use React's built-in escaping
- All user input must be validated
- LocalStorage stored data should be treated as untrusted (parse with try-catch)
- Never log passwords, tokens, or keys
