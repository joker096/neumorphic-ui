import { test, expect, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Icon/font audit — machine-readable check-and-fix cycle (see UI_CYCLE.md).
 *
 * Checks per view x viewport:
 *  - font-below-min: visible text is at least 11px
 *  - icon-control: a visible lucide icon inside a control is not larger than 60%
 *    of the control's smaller dimension (skip large controls >= 72px)
 *  - icon-text (warn): icon/text size ratio inside labeled buttons stays
 *    within [0.8, 1.75]
 *
 * Findings are aggregated into test-results/icon-font-audit-report.json.
 */

type View = 'chats' | 'chat-open';

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
  { name: '375x667 iPhone SE', width: 375, height: 667 },
  { name: '1440x900 desktop', width: 1440, height: 900 },
];

const VIEWS: View[] = ['chats', 'chat-open'];

const REPORT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'test-results', 'icon-font-audit-report.json');

const findingKey = (f: Finding): string => `${f.viewport}|${f.view}|${f.check}|${f.severity}|${f.element}|${f.detail}`;

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

/** Serialized into the page context. Returns raw findings. */
const auditInPage = (): { findings: Omit<Finding, 'viewport' | 'view'>[] } => {
  const findings: Omit<Finding, 'viewport' | 'view'>[] = [];
  const CAP = 25;
  const totals: Record<string, number> = {};
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

  const isVisible = (el: Element): boolean => el.checkVisibility && el.checkVisibility();
  const inView = (r: DOMRect): boolean => r.left < window.innerWidth && r.right > 0 && r.top < window.innerHeight && r.bottom > 0;
  const hasOwnText = (el: Element): boolean =>
    Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim());

  // --- font-below-min ---
  const textEls: Element[] = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (!isVisible(el)) return;
    if (el.closest('[aria-hidden="true"]')) return;
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'TEMPLATE') return;
    if (hasOwnText(el)) textEls.push(el);
  });
  textEls.forEach((el) => {
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < 11) {
      push('font-below-min', 'error', describe(el), `font-size=${px}px text="${(el.textContent ?? '').trim().slice(0, 40)}"`);
    }
  });

  // --- icon-control ---
  const INTERACTIVE =
    'button:not([disabled]),a[href],input,select,textarea,[role="button"],[role="switch"],[role="tab"],[role="checkbox"],[role="menuitem"],[role="option"],[role="link"]';
  const controls = Array.from(document.querySelectorAll<HTMLElement>(INTERACTIVE))
    .filter((el) => isVisible(el) && !el.closest('[aria-hidden="true"]'))
    .filter((el) => !Array.from(document.querySelectorAll<HTMLElement>(INTERACTIVE)).some((o) => o !== el && o.contains(el)));
  controls.forEach((control) => {
    const cr = control.getBoundingClientRect();
    if (!inView(cr)) return;
    const minDim = Math.min(cr.width, cr.height);
    if (minDim >= 72) return;
    control.querySelectorAll('svg.lucide').forEach((svg) => {
      if (!isVisible(svg) || svg.closest('[aria-hidden="true"]')) return;
      const sr = svg.getBoundingClientRect();
      if (sr.width <= 0) return;
      if (sr.width > 0.6 * minDim) {
        push('icon-control', 'error', describe(control), `icon=${Math.round(sr.width)}px control=${Math.round(cr.width)}x${Math.round(cr.height)}px`);
      }
    });
  });

  // --- icon-text (warn) ---
  const labeledButtons = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"]'))
    .filter((el) => isVisible(el) && !el.closest('[aria-hidden="true"]'))
    .filter((el) => !Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"]')).some((o) => o !== el && o.contains(el)));
  labeledButtons.forEach((btn) => {
    if (!(btn.textContent ?? '').trim()) return;
    const fontSizes: number[] = [];
    if (hasOwnText(btn)) fontSizes.push(parseFloat(getComputedStyle(btn).fontSize));
    btn.querySelectorAll('*').forEach((el) => {
      if (isVisible(el) && hasOwnText(el)) fontSizes.push(parseFloat(getComputedStyle(el).fontSize));
    });
    const fs = Math.min(...fontSizes.filter((n) => Number.isFinite(n) && n > 0));
    if (!Number.isFinite(fs) || fs <= 0) return;
    btn.querySelectorAll('svg.lucide').forEach((svg) => {
      if (!isVisible(svg) || svg.closest('[aria-hidden="true"]')) return;
      const w = svg.getBoundingClientRect().width;
      if (!w) return;
      const ratio = w / fs;
      if (ratio < 0.8 || ratio > 1.75) {
        push('icon-text', 'warn', describe(btn), `icon/text ratio=${ratio.toFixed(2)} icon=${Math.round(w)}px font=${Math.round(fs)}px`);
      }
    });
  });

  return { findings };
};

async function gotoView(page: Page, view: View, vp: Viewport): Promise<void> {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html[data-theme]')).toHaveAttribute('data-theme', 'dark', { timeout: 20000 });
  await page.waitForTimeout(400);
  if (view === 'chat-open') {
    await page.getByText('Alice Freeman').first().click();
    await page.waitForTimeout(600);
  }
}

async function runAudit(page: Page, viewport: string, view: string): Promise<{ errors: Finding[]; warnings: Finding[] }> {
  let findings = (await page.evaluate(auditInPage)).findings as Finding[];
  const errorCount = (fs: Finding[]): number => fs.filter((f) => f.severity === 'error').length;
  if (errorCount(findings) > 0) {
    await page.waitForTimeout(900);
    const settled = (await page.evaluate(auditInPage)).findings as Finding[];
    if (errorCount(settled) <= errorCount(findings)) findings = settled;
  }
  recordFindings(findings, viewport, view);
  return { errors: findings.filter((f) => f.severity === 'error'), warnings: findings.filter((f) => f.severity === 'warn') };
}

test.describe('Icon/font audit (see UI_CYCLE.md)', () => {
  for (const vp of VIEWPORTS) {
    test(`scale: no below-min fonts or oversized control icons @ ${vp.name}`, async ({ page }) => {
      const allErrors: string[] = [];
      for (const view of VIEWS) {
        await gotoView(page, view, vp);
        const { errors } = await runAudit(page, vp.name, view);
        allErrors.push(...errors.map((e) => `[${e.check}] ${view}: ${e.element}: ${e.detail}`));
      }
      expect(allErrors, `Icon/font audit (${vp.name}) must have 0 violations`).toHaveLength(0);
    });
  }
});
