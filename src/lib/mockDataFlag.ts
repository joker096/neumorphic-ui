export const MOCK_DATA_ENABLED: boolean =
  ((import.meta.env as any)?.VITE_USE_MOCK === 'true') ||
  typeof process !== 'undefined' &&
  (process.env?.NEXT_PUBLIC_USE_MOCK === 'true' || process.env?.REACT_APP_USE_MOCK === 'true');
