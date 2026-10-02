export type CompanyTab = 'members' | 'departments' | 'contacts' | 'inbox' | 'sitechat';
export type TFunction = (key: string, fallback?: string | Record<string, string | number>) => string;