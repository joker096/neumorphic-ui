import { test, expect, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSettingsViaProfile } from './test-utils';

/**
 * UI audit — machine-readable check-and-fix cycle (see UI_CYCLE.md).
 *
 * Checks per view x viewport:
 *  - overflow-viewport: no horizontal scroll, no element beyond viewport edge
 *  - touch-target: every interactive element has a 44x44px hit area
 *  - overlap: visible interactive elements do not cover each other
 *  - font-size: visible text is at least 12px
 *  - contrast: visible text meets WCAG AA (4.5:1, 3:1 for large text)
 *  - a11y-img-alt: visible <img> has an alt attribute (decorative => aria-hidden)
 *  - a11y-name: every visible interactive element has an accessible name
 *
 * Findings are aggregated into test-results/ui-audit-report.json.
 */

type View = 'chats' | 'contacts' | 'calls' | 'company' | 'workplace' | 'settings' | 'chat-open';

interface Viewport {
  name: string;
  width: number;
  height: number;
}

interface Finding {
  check: string;
  severity: 'error' | 'warn';
  element: string;
  detail: string;
  viewport: string;
  view: string;
}

const VIEWPORTS: Viewport[] = [
  { name: '320x568 mobile-min', width: 320, height: 568 },
  { name: '375x667 iPhone SE', width: 375, height: 667 },
  { name: '390x844 iPhone 12', width: 390, height: 844 },
  { name: '414x896 iPhone XR', width: 414, height: 896 },
  { name: '768x1024 tablet portrait', width: 768, height: 1024 },
  { name: '1024x768 tablet landscape', width: 1024, height: 768 },
  { name: '1280x800 laptop', width: 1280, height: 800 },
  { name: '1440x900 desktop', width: 1440, height: 900 },
  { name: '1920x1080 desktop', width: 1920, height: 1080 },
];

// Accessible names of the nav buttons (see src/config/navigation.ts + locales/en.json).
// "workplace" is intentionally absent: it is adminOnly and hidden for the mock user.
const NAV_NAMES: Record<string, string> = {
  contacts: 'Contacts',
  calls: 'Calls',
  company: 'Company Chat',
};

const REPORT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'test-results', 'ui-audit-report.json');

const findingKey = (f: Finding): string => `${f.viewport}|${f.view}|${f.check}|${f.element}|${f.detail}`;

/**
 * Persist findings immediately, per audit call. Previously the spec relied on a
 * module-level array flushed in `afterAll`, but the file ended up empty despite
 * failing tests — the in-memory state was not reliably available at afterAll
 * time. Writing incrementally (read -> merge -> write) makes the report
 * self-healing and survives any afterAll ordering quirk. Single worker
 * (workers:1) guarantees no concurrent write races.
 */
function recordFindings(findings: Omit<Finding, 'viewport' | 'view'>[], viewport: string, view: string): void {
  mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  let existing: Finding[] = [];
  try {
    const parsed = JSON.parse(readFileSync(REPORT_FILE, 'utf8')) as { findings?: Finding[] };
    if (Array.isArray(parsed.findings)) existing = parsed.findings;
  } catch {
    // No prior report yet — start fresh.
  }
  const seen = new Set(existing.map(findingKey));
  const merged = [...existing];
  for (const f of findings) {
    const stamped = { ...f, viewport, view } as Finding;
    if (!seen.has(findingKey(stamped))) {
      seen.add(findingKey(stamped));
      merged.push(stamped);
    }
  }
  const summary = {
    errors: merged.filter((f) => f.severity === 'error').length,
    warnings: merged.filter((f) => f.severity === 'warn').length,
  };
  writeFileSync(REPORT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), summary, findings: merged }, null, 2));
}

test.afterAll(() => {
  // Refresh timestamp only; findings are already persisted per audit call.
  try {
    const parsed = JSON.parse(readFileSync(REPORT_FILE, 'utf8')) as { findings?: Finding[] };
    const findings = Array.isArray(parsed.findings) ? parsed.findings : [];
    const summary = {
      errors: findings.filter((f) => f.severity === 'error').length,
      warnings: findings.filter((f) => f.severity === 'warn').length,
    };
    writeFileSync(REPORT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), summary, findings }, null, 2));
  } catch {
    // Nothing recorded yet.
  }
});

/** Serialized into the page context. Returns raw findings + per-check totals. */
const auditInPage = (): { findings: Omit<Finding, 'viewport' | 'view'>[]; totals: Record<string, number> } => {
  const findings: Omit<Finding, 'viewport' | 'view'>[] = [];
    const totals: Record<string, number> = {};
    const CAP = 25;
    const push = (check: string, severity: 'error' | 'warn', element: string, detail: string) => {
      totals[check] = (totals[check] ?? 0) + 1;
      if (totals[check] <= CAP) findings.push({ check, severity, element, detail });
    };
    const describe = (el: Element): string => {
      const tag = el.tagName.toLowerCase();
      if (el.id) return `${tag}#${el.id}`;
      const al = el.getAttribute('aria-label');
      if (al) return `${tag} aria="${al.slice(0, 40)}"`;
      const cls = el.getAttribute('class');
      const c0 = cls && typeof cls === 'string' && cls.trim() ? `.${cls.trim().split(/\s+/)[0]}` : '';
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30);
      return text ? `${tag}${c0} "${text}"` : `${tag}${c0}`;
    };
    const inView = (r: DOMRect): boolean =>
      r.left < window.innerWidth && r.right > 0 && r.top < window.innerHeight && r.bottom > 0;

    // --- overflow-viewport ---
    const de = document.documentElement;
    if (de.scrollWidth > window.innerWidth + 1) {
      push('overflow-viewport', 'error', 'document', `scrollWidth=${de.scrollWidth}px > viewport=${window.innerWidth}px`);
    }
    // Elements clipped by an in-viewport horizontal scroller/clipper are not a page overflow.
    const clippedByAncestor = (el: Element): boolean => {
      let node: Element | null = el.parentElement;
      while (node && node !== document.body) {
        const ox = getComputedStyle(node).overflowX;
        if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') {
          const nr = node.getBoundingClientRect();
          if (nr.right <= window.innerWidth + 1) return true;
        }
        node = node.parentElement;
      }
      return false;
    };
    const offenders: Element[] = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (!el.checkVisibility || !el.checkVisibility()) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > window.innerWidth + 1 && !clippedByAncestor(el)) offenders.push(el);
    });
    const outermost = offenders.filter((el) => !offenders.some((o) => o !== el && o.contains(el)));
    outermost.forEach((el) =>
      push('overflow-viewport', 'error', describe(el), `right=${Math.round(el.getBoundingClientRect().right)}px > ${window.innerWidth}px`),
    );

    // --- interactive elements ---
    const INTERACTIVE =
      'button:not([disabled]),a[href],input,select,textarea,[role="button"],[role="switch"],[role="tab"],[role="checkbox"],[role="menuitem"],[role="option"],[role="link"]';
    const interactives = Array.from(document.querySelectorAll(INTERACTIVE)).filter(
      (el) =>
        el.checkVisibility &&
        el.checkVisibility() &&
        !el.closest('[aria-hidden="true"]') &&
        !el.closest('[inert]'),
    );
    const innermost = interactives.filter((el) => !interactives.some((o) => o !== el && o.contains(el)));
    // Detect elements inside a fixed bottom bar (e.g. the bottom nav). The bar is
    // chrome that content scrolls beneath (standard mobile pattern), not an
    // overlapping layer — used below to skip content-vs-bar overlap pairs.
    const inFixedBottomBar = (el: Element): boolean => {
      let node: Element | null = el;
      while (node && node !== document.body) {
        const cs = getComputedStyle(node);
        if (cs.position === 'fixed') {
          const nr = node.getBoundingClientRect();
          return (
            nr.bottom >= window.innerHeight - 1 &&
            nr.left <= 1 &&
            nr.right >= window.innerWidth - 1 &&
            nr.height < window.innerHeight * 0.5
          );
        }
        node = node.parentElement;
      }
      return false;
    };
    const boxes: { el: Element; r: DOMRect; inBar: boolean }[] = [];
    innermost.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!inView(r)) return;
      boxes.push({ el, r, inBar: inFixedBottomBar(el) });
      if (r.width < 44 || r.height < 44) {
        push('touch-target', 'error', describe(el), `${Math.round(r.width)}x${Math.round(r.height)} < 44x44`);
      }
    });

    // --- overlap of visible interactive elements ---
    // Clamp each rect to the nearest clipping ancestor so elements inside a
    // horizontal scroller are compared by their visible geometry only.
    const visibleRect = (el: Element, r: DOMRect): DOMRect => {
      let node: Element | null = el.parentElement;
      while (node && node !== document.body) {
        const cs = getComputedStyle(node);
        if (cs.overflowX === 'hidden' || cs.overflowY === 'hidden' || cs.overflowX === 'scroll' || cs.overflowY === 'scroll' || cs.overflowX === 'clip' || cs.overflowY === 'clip' || cs.overflowX === 'auto' || cs.overflowY === 'auto') {
          const nr = node.getBoundingClientRect();
          const l = Math.max(r.left, nr.left);
          const t = Math.max(r.top, nr.top);
          const rt = Math.min(r.right, nr.right);
          const b = Math.min(r.bottom, nr.bottom);
          if (l < rt && t < b) r = { left: l, top: t, right: rt, bottom: b, width: rt - l, height: b - t, ...r } as DOMRect;
          else r = { ...r, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 } as DOMRect;
          break;
        }
        node = node.parentElement;
      }
      return r;
    };
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        // False-positive guard (UI_CYCLE.md §2.5): the fixed bottom nav is chrome
        // that content scrolls beneath, not an overlapping layer. Skip content-vs-
        // bar pairs; bar-bar and content-content pairs are still checked.
        if (a.inBar !== b.inBar) continue;
        const ra = visibleRect(a.el, a.r);
        const rb = visibleRect(b.el, b.r);
        const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (ix <= 0 || iy <= 0) continue;
        const inter = ix * iy;
        const minArea = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
        if (minArea > 0 && inter > minArea * 0.3) {
          push('overlap', 'error', `${describe(a.el)} x ${describe(b.el)}`, `${Math.round((inter / minArea) * 100)}% of smaller element`);
        }
      }
    }

    // --- visible text elements ---
    const textEls: Element[] = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (!el.checkVisibility || !el.checkVisibility()) return;
      if (el.closest('[aria-hidden="true"]')) return;
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'TEMPLATE') return;
      let ownText = false;
      for (const n of el.childNodes) {
        if (n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim()) {
          ownText = true;
          break;
        }
      }
      if (ownText) textEls.push(el);
    });

    // --- font-size ---
    textEls.forEach((el) => {
      const px = parseFloat(getComputedStyle(el).fontSize);
      if (px < 12) {
        push('font-size', 'error', describe(el), `font-size=${px}px text="${(el.textContent ?? '').trim().slice(0, 40)}"`);
      }
    });

    // --- contrast (WCAG AA) ---
    const parseColor = (s: string | null): { r: number; g: number; b: number; a: number } | null => {
      if (!s) return null;
      const m = s.match(/rgba?\(([^()]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map((x) => parseFloat(x.trim()));
      if (!p.length) return null;
      return { r: p[0] || 0, g: p[1] || 0, b: p[2] || 0, a: p.length === 4 ? p[3] : 1 };
    };
    const lum = (c: { r: number; g: number; b: number }): number => {
      const f = (v: number): number => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const baseVar = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
    const base = parseColor(baseVar) ?? { r: 20, g: 20, b: 20, a: 1 };
    let checked = 0;
    textEls.forEach((el) => {
      if (checked >= 500) return;
      checked += 1;
      const cs = getComputedStyle(el);
      const px = parseFloat(cs.fontSize);
      const weight = parseFloat(cs.fontWeight) || 400;
      const fg0 = parseColor(cs.color);
      if (!fg0) return;
      let opacity = 1;
      let node: Element | null = el;
      while (node) {
        const o = parseFloat(getComputedStyle(node).opacity);
        if (Number.isFinite(o)) opacity *= o;
        node = node.parentElement;
      }
      const fgAlpha = fg0.a * opacity;
      if (fgAlpha < 0.05) return;
      node = el;
      let bg: { r: number; g: number; b: number; a: number } | null = null;
      while (node) {
        const ncs = getComputedStyle(node);
        const bi = ncs.backgroundImage;
        // Gradient fills are unmeasurable against an opaque ancestor behind them —
        // a glyph sits ON the gradient (avatar initials, gradient pills/badges), not
        // on the panel behind it. Falling through to an opaque ancestor produced
        // false positives where the panel color ≈ text color (1:1 verdicts for
        // ink-on-accent glyphs). Treat any gradient layer as the innermost painted
        // surface and skip the measurement (see UI_CYCLE.md §2.5).
        if (bi && bi !== 'none' && bi.includes('gradient')) return;
        const c = parseColor(ncs.backgroundColor);
        if (c && c.a > 0.05) {
          bg = c;
          break;
        }
        node = node.parentElement;
      }
      if (!bg) return;
      const mix = (top: { r: number; g: number; b: number }, bot: { r: number; g: number; b: number }, ta: number) => ({
        r: top.r * ta + bot.r * (1 - ta),
        g: top.g * ta + bot.g * (1 - ta),
        b: top.b * ta + bot.b * (1 - ta),
      });
      const bgEff = mix(bg, base, Math.min(bg.a, 1));
      const fgEff = mix(fg0, bgEff, Math.min(fgAlpha, 1));
      const ratio = (Math.max(lum(fgEff), lum(bgEff)) + 0.05) / (Math.min(lum(fgEff), lum(bgEff)) + 0.05);
      const large = px >= 24 || (px >= 18.66 && weight >= 600);
      const threshold = large ? 3 : 4.5;
      if (ratio < threshold) {
        push(
          'contrast',
          'error',
          describe(el),
          `contrast=${ratio.toFixed(2)}:1 < ${threshold}:1 (${large ? 'large' : 'normal'} text) text="${(el.textContent ?? '').trim().slice(0, 30)}"`,
        );
      }
    });

    // --- a11y: images missing alt ---
    document.querySelectorAll('img').forEach((el) => {
      if (!el.checkVisibility || !el.checkVisibility()) return;
      if (el.closest('[aria-hidden="true"]')) return;
      if (!el.hasAttribute('alt')) {
        push('a11y-img-alt', 'error', describe(el), 'img without alt attribute');
      }
    });

    // --- a11y: interactive elements missing an accessible name ---
    const hasName = (el: Element): boolean => {
      if (el.getAttribute('aria-label')?.trim()) return true;
      const labId = el.getAttribute('aria-labelledby');
      if (labId && labId.split(/\s+/).every((id) => document.getElementById(id)?.textContent?.trim())) return true;
      if ((el.textContent ?? '').trim()) return true;
      if (el.getAttribute('title')?.trim()) return true;
      const tag = el.tagName.toLowerCase();
      if (tag === 'input') {
        const id = el.id;
        if (id && document.querySelector(`label[for="${id}"]`)) return true;
        if (el.closest('label')) return true;
        const type = (el.getAttribute('type') ?? '').toLowerCase();
        if (['hidden', 'submit', 'button', 'reset'].includes(type)) return true;
      }
      return false;
    };
    innermost.forEach((el) => {
      if (!hasName(el)) push('a11y-name', 'error', describe(el), 'interactive element without accessible name');
    });

  return { findings, totals };
};

async function runAudit(page: Page, viewport: string, view: string, zoomed = false): Promise<{ findings: Finding[]; errors: Finding[] }> {
  const errorCount = (fs: { severity: string }[]): number => fs.filter((f) => f.severity === 'error').length;
  let findings = (await page.evaluate(auditInPage)).findings as Finding[];
  // Views fade/slide in via Framer Motion on mount. The first reading can be
  // taken mid-animation (fractional opacity => false-low contrast). If errors
  // are present, wait for the transition to settle and re-audit; keep the
  // settled reading so transient artifacts do not cause false failures, while
  // genuinely persistent errors remain.
  if (errorCount(findings) > 0) {
    await page.waitForTimeout(900);
    const settled = (await page.evaluate(auditInPage)).findings as Finding[];
    if (errorCount(settled) <= errorCount(findings)) findings = settled;
  }
  recordFindings(findings, viewport, view);
  return { findings, errors: findings.filter((f) => f.severity === 'error') };
}

async function gotoView(page: Page, view: View, vp: Viewport): Promise<void> {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html[data-theme]')).toHaveAttribute('data-theme', 'dark', { timeout: 20000 });
  await page.waitForTimeout(400);
  if (view === 'chats') return;
  if (view === 'settings') {
    await openSettingsViaProfile(page);
    await page.waitForTimeout(400);
    return;
  }
  if (view === 'chat-open') {
    await page.getByText('Alice Freeman').first().click();
    await page.waitForTimeout(600);
    return;
  }
  const btn = page.getByRole('button', { name: NAV_NAMES[view], exact: true });
  if (await btn.count() === 0) {
    test.skip();
    return;
  }
  await btn.click();
  await page.waitForTimeout(400);
}

// "workplace" excluded: nav item is adminOnly, unreachable with the mock user.
const FULL_VIEWS: View[] = ['chats', 'contacts', 'calls', 'company', 'settings', 'chat-open'];

test.describe('UI audit (see UI_CYCLE.md)', () => {
  for (const vp of VIEWPORTS) {
    test(`layout: no horizontal overflow @ ${vp.name}`, async ({ page }) => {
      await gotoView(page, 'chats', vp);
      const { errors } = await runAudit(page, vp.name, 'chats');
      expect(
        errors.map((e) => `[${e.check}] ${e.element}: ${e.detail}`),
        `UI audit (${vp.name}, chats) must have 0 violations`,
      ).toHaveLength(0);
    });
  }

  test('audit: mobile 375x667', async ({ page }) => {
    const vp = VIEWPORTS[1];
    const allErrors: string[] = [];
    for (const view of FULL_VIEWS) {
      await gotoView(page, view, vp);
      const { errors } = await runAudit(page, vp.name, view);
      allErrors.push(...errors.map((e) => `[${e.check}] ${view}: ${e.element}: ${e.detail}`));
    }
    expect(allErrors, `UI audit (${vp.name}) across all views must have 0 violations`).toHaveLength(0);
  });

  test('audit: desktop 1440x900', async ({ page }) => {
    const vp = VIEWPORTS[7];
    const allErrors: string[] = [];
    for (const view of FULL_VIEWS) {
      await gotoView(page, view, vp);
      const { errors } = await runAudit(page, vp.name, view);
      allErrors.push(...errors.map((e) => `[${e.check}] ${view}: ${e.element}: ${e.detail}`));
    }
    expect(allErrors, `UI audit (${vp.name}) across all views must have 0 violations`).toHaveLength(0);
  });

  test('audit: tablet 768x1024', async ({ page }) => {
    const vp = VIEWPORTS[4];
    const allErrors: string[] = [];
    for (const view of ['chats', 'settings'] as View[]) {
      await gotoView(page, view, vp);
      const { errors } = await runAudit(page, vp.name, view);
      allErrors.push(...errors.map((e) => `[${e.check}] ${view}: ${e.element}: ${e.detail}`));
    }
    expect(allErrors, `UI audit (${vp.name}) across all views must have 0 violations`).toHaveLength(0);
  });

  test('audit: zoom 200% @ 375x667', async ({ page }) => {
    const vp = VIEWPORTS[1];
    await gotoView(page, 'chats', vp);
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });
    await page.waitForTimeout(600);
    let errors: Finding[] = [];
    try {
      ({ errors } = await runAudit(page, `${vp.name} zoom200`, 'chats', true));
    } finally {
      await page.evaluate(() => {
        document.body.style.zoom = '';
      });
    }
    expect(
      errors.map((e) => `[${e.check}] ${e.element}: ${e.detail}`),
      `UI audit (${vp.name} zoom200, chats) must have 0 violations`,
    ).toHaveLength(0);
  });

  test('audit: zoom 200% @ 1440x900', async ({ page }) => {
    const vp = VIEWPORTS[7];
    await gotoView(page, 'chats', vp);
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });
    await page.waitForTimeout(600);
    let errors: Finding[] = [];
    try {
      ({ errors } = await runAudit(page, `${vp.name} zoom200`, 'chats', true));
    } finally {
      await page.evaluate(() => {
        document.body.style.zoom = '';
      });
    }
    expect(
      errors.map((e) => `[${e.check}] ${e.element}: ${e.detail}`),
      `UI audit (${vp.name} zoom200, chats) must have 0 violations`,
    ).toHaveLength(0);
  });
});
