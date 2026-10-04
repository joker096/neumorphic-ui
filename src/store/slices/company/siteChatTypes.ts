/** Widget visual config — rides inside the embed token (public material). */
export interface SiteChatWidgetConfig {
  accent: string;
  position: 'bottom-right' | 'bottom-left';
  greeting: string;
  collectContact: boolean;
}

/** A visitor contact captured from an embedded site chat (E2E envelope). */
export interface WebsiteContactRecord {
  id: string;
  siteChatId: string;
  domain: string;
  name: string;
  email?: string;
  phone?: string;
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  ts: number;
  visitCount: number;
  /** Linked CRM contact userId once imported. */
  crmUserId?: string;
}

export interface SiteChat {
  id: string;
  name: string;
  token: string;
  snippet: string;
  createdAt: number;
  config: SiteChatWidgetConfig;
}

export const DEFAULT_SITE_CHAT_CONFIG: SiteChatWidgetConfig = {
  accent: '#6C5CE7',
  position: 'bottom-right',
  greeting: 'Hello! How can we help?',
  collectContact: true,
};