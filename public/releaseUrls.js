// ═══════════════════════════════════════════
// RELEASE URL HELPERS
//
// Shared by the downloads page (/downloads.html) and the landing page
// (/landing/). The release manifest (dist/releases/releases.json) is
// published next to the downloadable artifacts and lists every build by its
// bare file name. Its `url` field is relative to the page that renders it
// ("./releases/<file>"), which is correct for a page served from the site
// root - but the landing page lives one directory deeper (/landing/), so
// those urls would resolve to /landing/releases/<file> and 404.
//
// The helpers below build the asset links from the manifest base instead and
// keep a same-origin / https guard, so a manifest can never inject a
// javascript: or a third-party http: link.
// ══════════════════════════════════════════
(function (global) {
  'use strict';

  // Directory that holds the published artifacts. Prefer the manifest base
  // (absolute, set by the release pipeline); fall back to the folder the
  // manifest itself was fetched from.
  function releaseBase(manifest, pageUrl) {
    var base = manifest && typeof manifest.baseUrl === 'string' ? manifest.baseUrl.trim() : '';
    if (base) return base.endsWith('/') ? base : base + '/';
    return new URL('../releases/', pageUrl).href;
  }

  // Only same-origin or https links are allowed into an href.
  function safeUrl(value, pageUrl) {
    try {
      var url = new URL(String(value == null ? '' : value), pageUrl);
      if (url.origin === new URL(pageUrl).origin) return url.href;
      return url.protocol === 'https:' ? url.href : '';
    } catch (e) {
      return '';
    }
  }

  // Absolute link to one published artifact.
  function assetUrl(manifest, file, pageUrl) {
    if (!file) return '';
    return safeUrl(releaseBase(manifest, pageUrl) + encodeURIComponent(file), pageUrl);
  }

  global.MessAngerReleaseUrls = {
    releaseBase: releaseBase,
    safeUrl: safeUrl,
    assetUrl: assetUrl
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
