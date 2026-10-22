#!/usr/bin/env node
/**
 * Secret rotation helper.
 *
 * The server keeps its own secrets in an env file (`server/env.ts` resolves
 * `<root>/.env` first, then `<root>/server/.env`). Rotating them by hand means
 * editing that file, restarting the process and hoping that every secret got a
 * new value - that last part is exactly what a human forgets.
 *
 * This tool does the mechanical part and refuses to do the dangerous part:
 *
 *   - dry run by default: it prints the plan and the fingerprints of the
 *     current values, never a secret itself;
 *   - `--apply` writes new values (and keeps a timestamped backup);
 *   - only locally rotatable secrets are offered - third-party issued
 *     credentials (payment gateway, TURN) and the stored admin password are
 *     not ours to rotate;
 *   - the generated values are checked against the same fail-hard rules the
 *     server applies on start (length and the weak placeholder blocklist).
 *
 * Usage:
 *   node scripts/rotate-secrets.mjs                 # plan only
 *   node scripts/rotate-secrets.mjs --apply         # write new secrets
 *   node scripts/rotate-secrets.mjs --file server/.env --apply
 *   node scripts/rotate-secrets.mjs --key JWT_SECRET --apply
 */
import { createHash, randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** The server refuses to start with a secret shorter than this. */
export const MIN_SECRET_LENGTH = 32;

/**
 * Weak placeholders the server rejects on start (`server/signaling-server.ts`).
 * A generated value must never look like one of them.
 */
export const WEAK_SECRETS = new Set([
  'change_me',
  'changeme',
  'secret',
  'password',
  'admin',
  'test',
  'default',
  'jwt_secret',
]);

/**
 * Secrets this repository owns. Third-party issued credentials
 * (PAYMENTO_API_KEY / PAYMENTO_SECRET_KEY, TURN credentials) and the admin
 * password stored in the database are deliberately absent - rotating them here
 * would only produce a broken configuration.
 */
export const ROTATABLE_SECRETS = [
  {
    name: 'JWT_SECRET',
    bytes: 48,
    note: 'signs admin session tokens - rotating it signs every operator out and invalidates every relay token',
  },
  {
    name: 'RELAY_JWT_SECRET',
    bytes: 48,
    note: 'signs relay tokens - must stay different from JWT_SECRET',
  },
];

const ENV_KEY_PATTERN = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;

/**
 * A fresh random secret, URL-safe so it needs no quoting inside an env file.
 */
export function generateSecret(bytes = 48) {
  return randomBytes(bytes).toString('base64url');
}

/**
 * A short, non-reversible fingerprint of a secret. Lets an operator confirm
 * that a value changed without the tool ever printing the value.
 */
export function fingerprint(secret) {
  return createHash('sha256').update(secret).digest('hex').slice(0, 12);
}

/**
 * Parse the env file into the assignments it contains.
 */
export function parseEnvFile(content) {
  const entries = [];
  content.split(/\r?\n/).forEach((line, index) => {
    const match = ENV_KEY_PATTERN.exec(line);
    if (!match) return;
    const rest = line.slice(match[0].length);
    const value = rest.trim().replace(/^(['"])(.*)\1$/, '$2');
    entries.push({ key: match[1], value, index });
  });
  return entries;
}

/**
 * Which of the requested secrets the file already carries.
 */
export function planRotation(content, names) {
  const entries = parseEnvFile(content);
  return names.map((name) => {
    const entry = entries.find((candidate) => candidate.key === name);
    return {
      name,
      present: Boolean(entry),
      currentFingerprint: entry ? fingerprint(entry.value) : null,
    };
  });
}

/**
 * Write the given values into the env file. Comments, blank lines, key order
 * and every unrelated key stay untouched; a key that is not in the file yet is
 * appended.
 */
export function applyRotation(content, updates) {
  const lines = content.split(/\r?\n/);
  const pending = new Map(Object.entries(updates));
  const output = lines.map((line) => {
    const match = ENV_KEY_PATTERN.exec(line);
    const key = match?.[1];
    if (!key || !pending.has(key)) return line;
    const value = pending.get(key);
    pending.delete(key);
    return `${key}=${value}`;
  });
  for (const [key, value] of pending) {
    output.push(`${key}=${value}`);
  }
  return output.join('\n');
}

/**
 * Where the secrets live. Mirrors the resolution order of `server/env.ts`:
 * the repository root wins, the server directory is the fallback.
 */
export function resolveTargetFile(rootDir, explicitPath) {
  if (explicitPath) return resolve(explicitPath);
  const rootEnv = join(rootDir, '.env');
  if (existsSync(rootEnv)) return rootEnv;
  return join(rootDir, 'server', '.env');
}

/**
 * Guard the generated value against the rules the server enforces on start.
 */
export function assertUsableSecret(name, secret) {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`${name}: generated secret is shorter than ${MIN_SECRET_LENGTH} characters`);
  }
  if (WEAK_SECRETS.has(secret.trim().toLowerCase())) {
    throw new Error(`${name}: generated secret is on the weak-value blocklist`);
  }
  return secret;
}

/**
 * The repository root - the parent of the `scripts/` directory.
 *
 * The lookup is wrapped: under a test runner the module URL is not a plain
 * file URL, and a missing root must not break an explicit `--file` run.
 */
export function repositoryRoot() {
  try {
    return resolve(fileURLToPath(new URL('..', import.meta.url)));
  } catch {
    return process.cwd();
  }
}

function parseArgs(argv) {
  const options = { apply: false, file: null, keys: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--apply') {
      options.apply = true;
    } else if (arg === '--file') {
      options.file = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === '--key') {
      const key = argv[index + 1] ?? null;
      if (key) options.keys.push(key);
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function usage() {
  return [
    'Usage: node scripts/rotate-secrets.mjs [--apply] [--file <path>] [--key <NAME>]',
    '',
    '  --apply          write the new secrets (default: dry run, nothing is written)',
    '  --file <path>    env file to read and write (default: <root>/.env, else <root>/server/.env)',
    '  --key <NAME>     rotate only this secret (repeatable)',
  ].join('\n');
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(usage());
    return 0;
  }

  const known = ROTATABLE_SECRETS.map((entry) => entry.name);
  const requested = options.keys.length ? options.keys : known;
  const unknown = requested.filter((name) => !known.includes(name));
  if (unknown.length) {
    throw new Error(`Not rotatable here: ${unknown.join(', ')}`);
  }

  const target = options.file
    ? resolve(options.file)
    : resolveTargetFile(repositoryRoot(), null);
  if (!existsSync(target)) {
    throw new Error(
      `No env file at ${target}. Copy .env.example to .env and fill it in first.`,
    );
  }

  const content = readFileSync(target, 'utf8');
  const plan = planRotation(content, requested);
  const descriptions = new Map(ROTATABLE_SECRETS.map((entry) => [entry.name, entry]));

  console.log(`Target: ${target}`);
  console.log('Plan:');
  for (const item of plan) {
    const state = item.present ? `present (fingerprint ${item.currentFingerprint})` : 'missing - will be added';
    console.log(`  - ${item.name}: ${state}`);
    console.log(`      ${descriptions.get(item.name).note}`);
  }

  if (!options.apply) {
    console.log('');
    console.log('Dry run - nothing was written. Re-run with --apply to rotate.');
    return 0;
  }

  const updates = {};
  for (const name of requested) {
    const description = descriptions.get(name);
    const secret = assertUsableSecret(name, generateSecret(description.bytes));
    updates[name] = secret;
  }

  const backup = `${target}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  copyFileSync(target, backup);
  writeFileSync(target, applyRotation(content, updates), 'utf8');

  console.log('');
  console.log(`Rotated. Backup: ${backup}`);
  for (const [name, secret] of Object.entries(updates)) {
    console.log(`  - ${name}: new fingerprint ${fingerprint(secret)}`);
  }
  console.log('');
  console.log('Restart the server so it picks the new values up.');
  console.log('Rotating JWT_SECRET signs every operator out and invalidates every relay token.');
  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) {
  try {
    process.exit(main());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
