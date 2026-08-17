export class ServiceNotConfiguredError extends Error {
  constructor(public readonly service: string) {
    super(`Integration "${service}" is not configured. Provide an adapter via configureServices().`);
    this.name = "ServiceNotConfiguredError";
  }
}

export function isServiceNotConfiguredError(e: unknown): e is ServiceNotConfiguredError {
  return (
    e instanceof ServiceNotConfiguredError ||
    (typeof e === "object" && e !== null && (e as { name?: string }).name === "ServiceNotConfiguredError")
  );
}

export interface BotCommand {
  command: string;
  description: string;
}

export interface BotProfile {
  id: string;
  name: string;
  username?: string;
  description?: string;
  avatarColor?: string;
  avatarUrl?: string;
  verified?: boolean;
  commands: BotCommand[];
  canOpenMiniApp: boolean;
}

export interface InlineKeyboardButton {
  text: string;
  data?: string;
  url?: string;
}

export interface MiniAppDescriptor {
  name: string;
  url: string;
}

export interface BotService {
  getBotProfile(botId: string): Promise<BotProfile>;
  getInlineKeyboard(botId: string, messageId: string): Promise<InlineKeyboardButton[][]>;
  handleInlineButton(
    botId: string,
    messageId: string,
    button: InlineKeyboardButton,
  ): Promise<void>;
  getMiniApp(botId: string): Promise<MiniAppDescriptor | null>;
}

export interface Invoice {
  id: string;
  title: string;
  amount: number;
  currency: string;
  description?: string;
  status: "pending" | "paid" | "failed";
}

export interface PaymentsService {
  getInvoices(): Promise<Invoice[]>;
  createInvoice(input: { title: string; amount: number; currency: string; description?: string }): Promise<Invoice>;
  payInvoice(invoiceId: string): Promise<Invoice>;
}

export interface TranslateService {
  translate(text: string, from: string, to: string): Promise<string>;
  detectLang(text: string): Promise<string>;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  due?: string;
  assignee?: string;
}

export interface TasksService {
  listTasks(filter?: { done?: boolean }): Promise<Task[]>;
  createTask(input: { title: string; due?: string; assignee?: string }): Promise<Task>;
  updateTask(id: string, patch: Partial<Task>): Promise<Task>;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

export interface AutomationService {
  listRules(): Promise<AutomationRule[]>;
  toggleRule(id: string, enabled: boolean): Promise<AutomationRule>;
}

export interface MetricPoint {
  label: string;
  value: number;
}

export interface AnalyticsService {
  getChannelMetrics(channelId: string): Promise<MetricPoint[]>;
}

export interface ModerationItem {
  id: string;
  type: "message" | "user" | "report";
  summary: string;
  status: "open" | "resolved";
}

export interface ModerationService {
  listQueue(): Promise<ModerationItem[]>;
  resolve(id: string): Promise<ModerationItem>;
}

export interface KbArticle {
  id: string;
  title: string;
  body: string;
  tags: string[];
}

export interface KnowledgeBaseService {
  search(query: string): Promise<KbArticle[]>;
  getArticle(id: string): Promise<KbArticle>;
}

export interface Services {
  bot: BotService;
  payments: PaymentsService;
  translate: TranslateService;
  tasks: TasksService;
  automation: AutomationService;
  analytics: AnalyticsService;
  moderation: ModerationService;
  kb: KnowledgeBaseService;
}
