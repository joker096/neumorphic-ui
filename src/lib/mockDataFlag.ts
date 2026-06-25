export const MOCK_DATA_ENABLED: boolean =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_USE_MOCK === 'true') ||
  typeof process !== 'undefined' &&
  (process.env?.NEXT_PUBLIC_USE_MOCK === 'true' || process.env?.REACT_APP_USE_MOCK === 'true');
