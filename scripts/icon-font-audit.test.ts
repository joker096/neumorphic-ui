import { describe, expect, it } from 'vitest';
import {
  ICON_SCALE,
  ICON_HERO_SIZES,
  ICON_FLAG_CAP,
  FONT_RAMP,
  MIN_FONT_PX,
  FONT_FLAG_CAP,
  NAMED_FONT_PX,
  nearestRampValue,
  evaluateIconSize,
  evaluateFontSize,
  auditSource,
} from './icon-font-audit.mjs';

describe('icon-font scale constants', () => {
  it('matches the documented icon and font scales', () => {
    expect(ICON_SCALE).toEqual([12, 14, 16, 18, 20, 24, 28, 32]);
    expect(ICON_HERO_SIZES).toEqual([40, 44, 48]);
    expect(ICON_FLAG_CAP).toBe(100);
    expect(FONT_RAMP).toEqual([11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 40]);
    expect(MIN_FONT_PX).toBe(11);
    expect(FONT_FLAG_CAP).toBe(40);
  });

  it('maps Tailwind named sizes to the project px values', () => {
    expect(NAMED_FONT_PX['2xs']).toBe(11);
    expect(NAMED_FONT_PX.xs).toBe(12);
    expect(NAMED_FONT_PX.base).toBe(16);
    expect(NAMED_FONT_PX.lg).toBe(18);
    expect(NAMED_FONT_PX['3xl']).toBe(30);
    expect(NAMED_FONT_PX['4xl']).toBe(36);
  });
});

describe('evaluateIconSize', () => {
  it.each([12, 14, 16, 18, 20, 24, 28, 32, 40, 44, 48])('allows size %i', (n) => {
    expect(evaluateIconSize(n)).toBeNull();
  });

  it.each([11, 13, 15, 17, 19, 21, 22, 26, 30, 31, 33, 99])('flags off-scale size %i', (n) => {
    expect(evaluateIconSize(n)).toBeTypeOf('string');
  });

  it('skips decorative sizes at and above the cap', () => {
    expect(evaluateIconSize(100)).toBeNull();
    expect(evaluateIconSize(101)).toBeNull();
    expect(evaluateIconSize(200)).toBeNull();
  });
});

describe('evaluateFontSize', () => {
  it.each([11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 40])('allows ramp size %ipx', (px) => {
    expect(evaluateFontSize(px, `text-[${px}px]`)).toBeNull();
  });

  it('flags below-minimum sizes as F2', () => {
    expect(evaluateFontSize(10, 'text-[10px]')).toContain('F2');
    expect(evaluateFontSize(9.5, 'text-[9.5px]')).toContain('F2');
  });

  it('flags off-ramp sizes as F1', () => {
    expect(evaluateFontSize(15, 'text-[15px]')).toContain('F1');
    expect(evaluateFontSize(30, 'text-3xl')).toContain('F1');
    expect(evaluateFontSize(36, 'text-4xl')).toContain('F1');
    expect(evaluateFontSize(39, 'text-[39px]')).toContain('F1');
  });

  it('allows display sizes at and above the cap', () => {
    expect(evaluateFontSize(40, 'text-[40px]')).toBeNull();
    expect(evaluateFontSize(41, 'text-[41px]')).toBeNull();
  });
});

describe('nearestRampValue', () => {
  it('snaps known values to the nearest ramp step', () => {
    expect(nearestRampValue(10)).toBe(11);
    expect(nearestRampValue(17)).toBe(18);
    expect(nearestRampValue(30)).toBe(32);
    expect(nearestRampValue(33)).toBe(32);
    expect(nearestRampValue(38)).toBe(40);
  });
});

describe('auditSource', () => {
  it('flags off-scale lucide size props', () => {
    const findings = auditSource('<Icon size={10} />');
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ code: 'I1', severity: 'error', line: 1 });
  });

  it('flags below-minimum and off-ramp font classes', () => {
    const belowMin = auditSource('className="text-[10px]"');
    expect(belowMin).toHaveLength(1);
    expect(belowMin[0]).toMatchObject({ code: 'F2', severity: 'error', fix: 'text-[11px]' });

    const offRamp = auditSource('className="text-3xl"');
    expect(offRamp).toHaveLength(1);
    expect(offRamp[0]).toMatchObject({ code: 'F1', severity: 'error', fix: 'text-[32px]' });
  });

  it('allows in-scale sizes and relative units', () => {
    expect(auditSource('<Icon size={16} />')).toHaveLength(0);
    expect(auditSource('className="text-[12px]"')).toHaveLength(0);
    expect(auditSource('className="text-[0.9em]"')).toHaveLength(0);
    expect(auditSource('className="text-base"')).toHaveLength(0);
  });

  it('skips comments and non-size attributes', () => {
    expect(auditSource('// <Icon size={10} />')).toHaveLength(0);
    expect(auditSource('/* <Icon size={10} /> */')).toHaveLength(0);
    expect(auditSource('<Icon data-size="10" />')).toHaveLength(0);
    expect(auditSource('<Icon fontSize={10} />')).toHaveLength(0);
  });
});
