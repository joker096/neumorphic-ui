/** Joins truthy class names; keeps conditional composition readable. */
export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');
