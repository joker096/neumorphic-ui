#!/usr/bin/env node
/**
 * Script to replace hardcoded color values with CSS variable references
 * across all TypeScript/JSX component files.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

// All hardcoded color patterns -> their CSS variable replacements
const COLOR_REPLACEMENTS = [
  // Main background colors
  [/\#0d1017/g, 'var(--bg-primary)'],
  [/\#13151b/g, 'var(--bg-secondary)'],
  [/\#1a1d24/g, 'var(--bg-tertiary)'],
  [/\#1e2128/g, 'var(--bg-elevated)'],

  // Light theme backgrounds
  [/\#eaeff4/g, 'var(--bg-secondary)'],
  [/\#f0f2f5/g, 'var(--bg-primary)'],
  [/\#f1f5f9/g, 'var(--bg-secondary)'],
  [/\#e2e8f0/g, 'var(--bg-tertiary)'],
  [/\#f4f7f9/g, 'var(--bg-secondary)'],
  [/\#f8fafc/g, 'var(--bg-primary)'],
  [/\#e0e4e8/g, 'var(--bg-secondary)'],
  [/\#ffffff/g, 'var(--bg-elevated)'],

  // System background colors
  [/\#f97316/g, 'var(--accent)'],
  [/\#ea580c/g, 'var(--accent)'],

  // Text color replacements
  [/\btext-white\b(?![^<]*\/\*)/g, 'text-[var(--text-primary)]'],
  [/\btext-white\/\d/g, 'text-white/'], // Skip opacity variants

  // Border replacements
  [/border-white\/\d/g, 'border-white/'],
  [/border-black\/\d/g, 'border-black/'],
  [/border-white\/5/g, 'border-[var(--border-color)]'],
  [/border-black\/5/g, 'border-[var(--border-color)]'],
  [/border-white\/10/g, 'border-[var(--border-color)]'],
  [/border-black\/10/g, 'border-[var(--border-color)]'],
  [/border-white\/15/g, 'border-[var(--border-color)]'],
  [/border-black\/15/g, 'border-[var(--border-color)]'],
  [/border-white\/20/g, 'border-[var(--border-color)]'],
  [/border-black\/20/g, 'border-[var(--border-color)]'],
  [/border-white\/\d+/g, 'border-[var(--border-color)]'],
  [/border-black\/\d+/g, 'border-[var(--border-color)]'],
];

let modified = 0;

function walk(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git' || entry === 'test-results') {
        continue;
      }
      walk(fullPath);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      processFile(fullPath);
    }
  }
}

function processFile(filepath) {
  try {
    let content = readFileSync(filepath, 'utf-8');
    let changed = false;
    let original = content;

    // Apply replacements - do multiple passes for complex patterns
    for (let i = 0; i < 5; i++) {
      let prevChanged = false;
      for (const [pattern, replacement] of COLOR_REPLACEMENTS) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          prevChanged = true;
        }
      }
      if (!prevChanged) break;
    }

    if (content !== original) {
      writeFileSync(filepath, content);
      modified++;
      console.log(`Updated: ${filepath}`);
    }
  } catch (e) {
    console.error(`Error processing ${filepath}: ${e.message}`);
  }
}

walk(SRC_DIR);
console.log(`\nDone. Updated ${modified} files.`);
