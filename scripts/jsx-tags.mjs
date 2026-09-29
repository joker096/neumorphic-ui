/**
 * jsx-tags.mjs — a correct JSX opening-tag scanner, shared by the a11y checks.
 *
 * Regex-based attribute matching breaks on real components: `onChange={(e) => …}`
 * contains a `>` (from `=>`) that terminates a naive `<input\b([^>]*?)>` match, so
 * attributes after the first arrow function were invisible — a control that
 * already had an `aria-label` was reported as unlabelled.
 *
 * This scanner walks the tag while tracking:
 *   - brace depth (`{ … }`, nested)
 *   - quote state (', ", `) with backslash escapes
 *   - JSX strings inside expressions are handled by the quote tracking
 * and stops only at a `>` that is at brace depth 0 and outside quotes.
 */

/**
 * Blank out comments while preserving byte offsets and line breaks.
 *
 * A JSDoc line like "the layer never owns an `<input>` of its own" otherwise
 * parses as a real tag: the scanner returned an `input` with empty attrs (and,
 * because it rewinds `lastIndex` to the tag's `>`, desynchronised everything
 * after it). Replacing comment bodies with spaces keeps `slice()` offsets and
 * line numbers exact, so reported positions stay true to the source.
 *
 * String and template literals are tracked, so a `//` or `/*` inside them is
 * left alone.
 *
 * @param {string} code
 * @returns {string}
 */
export function stripComments(code) {
  let out = '';
  let quote = null;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (quote) {
      out += c;
      if (c === '\\') { out += code[i + 1] ?? ''; i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; continue; }
    if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      const stop = end === -1 ? code.length : end + 2;
      for (let j = i; j < stop; j++) out += code[j] === '\n' ? '\n' : ' ';
      i = stop - 1;
      continue;
    }
    if (c === '/' && code[i + 1] === '/') {
      let j = i;
      while (j < code.length && code[j] !== '\n') { out += ' '; j++; }
      i = j - 1;
      continue;
    }
    out += c;
  }
  return out;
}

/**
 * Find opening tags of the given element names.
 * @param {string} code
 * @param {string[]} names  e.g. ['input', 'textarea', 'select']
 * @returns {{name:string, attrs:string, start:number, end:number, selfClosing:boolean, line:number}[]}
 */
export function findOpeningTags(code, names) {
  const want = new Set(names);
  const out = [];
  // Comments are blanked first; offsets and line numbers are preserved, so the
  // positions handed back still point at the original source.
  const src = stripComments(code);
  const re = /<([A-Za-z][A-Za-z0-9._]*)\b/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    if (!want.has(name)) continue;

    let i = re.lastIndex;
    let depth = 0;
    let quote = null;
    let closed = false;
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) {
        if (c === '\\') { i++; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '{') { depth++; continue; }
      if (c === '}') { depth--; continue; }
      if (c === '>' && depth === 0) { closed = true; break; }
    }
    if (!closed) continue;
    const attrs = src.slice(re.lastIndex, i);
    out.push({
      name,
      attrs,
      start: m.index,
      end: i,
      selfClosing: /\/\s*$/.test(attrs),
      line: src.slice(0, m.index).split('\n').length,
    });
    re.lastIndex = i;
  }
  return out;
}
