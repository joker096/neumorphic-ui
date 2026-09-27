/**
 * Build metadata for the About surfaces (landing hero, settings, system status).
 * Setting defaults live in the store slices themselves.
 */
export const APP_INFO = {
  NAME: 'Mess&Anger',
  BUILD_DATE: (typeof __APP_BUILD_DATE__ === 'string' && __APP_BUILD_DATE__) || 'dev',
  VERSION: '1.0',
};
