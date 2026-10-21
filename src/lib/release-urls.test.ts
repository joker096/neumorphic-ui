import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

/**
 * The static landing page (/landing/) renders the release manifest that lives
 * in /releases/. The manifest stores page-relative urls ("./releases/<file>"),
 * which on that page resolve to /landing/releases/<file> and 404, so the
 * landing page builds its asset links from the manifest base instead.
 *
 * These tests load the shipped helper (public/landing/releaseUrls.js) and
 * check the resolution rules against the real manifest shape.
 */

const HELPERS_PATH = path.resolve(__dirname, '../../public/landing/releaseUrls.js');

interface ReleaseHelpers {
  releaseBase(manifest: unknown, pageUrl: string): string;
  safeUrl(value: unknown, pageUrl: string): string;
  assetUrl(manifest: unknown, file: unknown, pageUrl: string): string;
}

function loadHelpers(): ReleaseHelpers {
  const source = fs.readFileSync(HELPERS_PATH, 'utf8');
  const context: Record<string, unknown> = { URL };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.MessAngerReleaseUrls as ReleaseHelpers;
}

const helpers = loadHelpers();

const LANDING_PAGE = 'https://mess.cvr.name/landing/index.html';
const MANIFEST = {
  version: '1.0.0',
  baseUrl: 'https://mess.cvr.name/releases/',
  files: [
    { platform: 'windows', kind: 'msi', file: 'Mess&Anger_1.0.0_x64_en-US.msi', present: true },
    { platform: 'android', kind: 'apk', file: 'app-release-signed.apk', present: true },
  ],
};

describe('landing release urls', () => {
  it('resolves an artifact to the releases folder', () => {
    expect(helpers.assetUrl(MANIFEST, 'app-release-signed.apk', LANDING_PAGE)).toBe(
      'https://mess.cvr.name/releases/app-release-signed.apk',
    );
  });

  it('never points a landing asset link at /landing/releases', () => {
    const href = helpers.assetUrl(MANIFEST, 'app-release-signed.apk', LANDING_PAGE);
    expect(href).not.toContain('/landing/');
  });

  it('encodes characters that would break the path', () => {
    const href = helpers.assetUrl(MANIFEST, 'Mess&Anger_1.0.0_x64_en-US.msi', LANDING_PAGE);
    expect(href).toBe('https://mess.cvr.name/releases/Mess%26Anger_1.0.0_x64_en-US.msi');
  });

  it('falls back to the folder the manifest was loaded from', () => {
    expect(helpers.assetUrl({}, 'app-release-signed.apk', LANDING_PAGE)).toBe(
      'https://mess.cvr.name/releases/app-release-signed.apk',
    );
  });

  it('keeps a root page working as well', () => {
    expect(helpers.assetUrl(MANIFEST, 'app-release-signed.apk', 'https://mess.cvr.name/downloads.html')).toBe(
      'https://mess.cvr.name/releases/app-release-signed.apk',
    );
  });

  it('rejects script and foreign http urls', () => {
    expect(helpers.safeUrl('javascript:alert(1)', LANDING_PAGE)).toBe('');
    expect(helpers.safeUrl('http://evil.example/x.exe', LANDING_PAGE)).toBe('');
  });

  it('keeps absolute https store links', () => {
    expect(helpers.safeUrl('https://play.google.com/store/apps/details?id=com.messanger.e2e', LANDING_PAGE)).toBe(
      'https://play.google.com/store/apps/details?id=com.messanger.e2e',
    );
  });

  it('has no asset link for a missing file name', () => {
    expect(helpers.assetUrl(MANIFEST, '', LANDING_PAGE)).toBe('');
    expect(helpers.assetUrl(MANIFEST, null, LANDING_PAGE)).toBe('');
  });

  it('the landing page builds its download links through the helper', () => {
    const page = fs.readFileSync(path.resolve(__dirname, '../../public/landing/app.js'), 'utf8');
    expect(page).toContain('RU.assetUrl(manifest, f.file');
    expect(page).not.toContain("btn('Download ' + kindLabel, f.url");
  });
});
