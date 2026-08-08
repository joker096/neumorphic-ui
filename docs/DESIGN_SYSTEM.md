# Design System — Mess&Anger

## 1. Общие принципы

- **Neumorphism + editorial minimalism**: тени, мягкие поверхности, editorial типографика.
- **Тёмная тема по умолчанию**, светлая — опциональная.
- **Touch-first**: все интерактивные элементы ≥ 44×44 px.
- **Reduced motion**: уважаем `prefers-reduced-motion`.
- **A11y-first**: semantic HTML, aria-*, focus-visible, skip-links.

## 2. Цвета

### 2.1 Landing (Editorial / Gold)

| Token | Dark | Light |
|-------|------|-------|
| `--black` | `#070707` | `#f2f2ec` |
| `--surf` | `#0d0d0d` | `#e6e6e3` |
| `--surf2` | `#131313` | `#dbdbd8` |
| `--cream` | `#f0ece4` | `#1a1d22` |
| `--gold` | `#c9a96e` | `#c9a96e` |
| `--muted` | `rgba(240,236,228,0.55)` | `rgba(26,29,34,0.65)` |
| `--bd` | `rgba(255,255,255,0.07)` | `rgba(0,0,0,0.1)` |

### 2.2 App (Modern / Orange)

| Token | Dark | Light |
|-------|------|-------|
| `--bg-primary` | `#0d1017` | `#f8fafc` |
| `--bg-secondary` | `#13151b` | `#ffffff` |
| `--bg-tertiary` | `#1a1d24` | `#f1f5f9` |
| `--text-primary` | `#f0f2f5` | `#0f172a` |
| `--text-secondary` | `#9ca3af` | `#475569` |
| `--text-tertiary` | `#8b95a5` | `#94a3b8` |
| `--accent` | `#f97316` | `#f97316` |
| `--border-color` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.08)` |

> **Важно**: Landing и App используют разные акцентные цвета (gold vs orange) и разные фоны. Это осознанное разделение: landing — editorial/high-end, app — productivity/modern.

## 3. Типографика

### 3.1 Шрифты

| Назначение | Landing | App |
|------------|---------|-----|
| Sans (body) | `Outfit` | `ui-sans-serif, system-ui` |
| Mono | `DM Mono` | `ui-monospace, SFMono-Regular` |
| Serif (display) | `Cormorant Garamond` | — |

### 3.2 Масштаб

| Размер | Landing | App |
|--------|---------|-----|
| xs | 10px | 9px |
| sm | 11px | 10px |
| base | 13–14px | 14px |
| lg | 18px | 16px |
| xl | 24px | 18px |
| 2xl | 48px | 24px |

## 4. Spacing

Единая шкала (CSS custom properties в landing, Tailwind utilities в app):

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 24px
--space-6: 32px
--space-7: 48px
--space-8: 64px
```

Использование:
- Landing: `var(--space-4)` и т.д.
- App: Tailwind `p-4`, `gap-6` и т.д.

## 5. Компоненты

### 5.1 Кнопки

| Вариант | Стиль |
|---------|-------|
| Primary | `bg-[accent] text-white` |
| Secondary | `border border-[accent] text-[accent]` |
| Ghost | `text-[text-secondary] hover:text-[text-primary]` |

Минимальный размер: **44×44 px**.

### 5.2 Карточки

| Тип | Landing | App |
|-----|---------|-----|
| Raised | `background: var(--surf); border: 1px solid var(--bd)` | `neu-raised` |
| Flat | `border: 1px solid var(--bd); background: transparent` | `border border-[border-color]` |
| Mid (gold border) | `border-color: var(--gold); border-top: 1px solid var(--gold)` | accent border |

### 5.3 Формы

- Input: `bg-[bg-tertiary] border border-[border-color] rounded-xl`
- Focus: `border-[accent] ring-2 ring-[accent-soft]`
- Placeholder: `text-[text-tertiary]`

### 5.4 Навигация

| Тип | Landing | App |
|-----|---------|-----|
| Top nav | fixed, backdrop-blur, `nav.s` | Sidebar / Bottom |
| Mobile nav | hamburger + slide-out panel | Bottom tab bar |

## 6. Анимации

| Эффект | Длительность | Easing |
|--------|--------------|--------|
| Hover | 0.2s | ease-out |
| Reveal | 0.6s | ease-out |
| Parallax/Tilt | requestAnimationFrame | — |
| Counter | 1.4s | cubic-bezier(0.22, 1, 0.36, 1) |

Все анимации отключаются при `prefers-reduced-motion: reduce`.

## 7. Accessibility

- Все интерактивные элементы ≥ 44×44 px.
- Контраст текста/фона ≥ 4.5:1 (WCAG AA).
- `aria-label` для icon-only кнопок.
- `role`, `aria-expanded`, `tabindex` для кастомных виджетов.
- Skip-link на каждой странице.
- Фокус виден: `focus-visible:ring-2 focus-visible:ring-orange-500/40`.

## 8. Производительность

- LCP < 2.5s (ленивая загрузка медиа, preconnect fonts).
- CLS < 0.1 (width/height для изображений, canvas).
- FID < 100ms (throttle на mousemove для tilt-эффектов).
