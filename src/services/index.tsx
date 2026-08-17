import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  isServiceNotConfiguredError,
  ServiceNotConfiguredError,
  type AutomationService,
  type AnalyticsService,
  type BotService,
  type KnowledgeBaseService,
  type ModerationService,
  type PaymentsService,
  type Services,
  type TasksService,
  type TranslateService,
} from "./types";
import { DataState } from "../components/ui/DataState";

function notConfigured(service: string): Promise<never> {
  return Promise.reject(new ServiceNotConfiguredError(service));
}

const unconfiguredBot: BotService = {
  getBotProfile: () => notConfigured("bot"),
  getInlineKeyboard: () => notConfigured("bot"),
  handleInlineButton: () => notConfigured("bot"),
  getMiniApp: () => notConfigured("bot"),
};

const unconfiguredPayments: PaymentsService = {
  getInvoices: () => notConfigured("payments"),
  createInvoice: () => notConfigured("payments"),
  payInvoice: () => notConfigured("payments"),
};

const unconfiguredTranslate: TranslateService = {
  translate: () => notConfigured("translate"),
  detectLang: () => notConfigured("translate"),
};

const unconfiguredTasks: TasksService = {
  listTasks: () => notConfigured("tasks"),
  createTask: () => notConfigured("tasks"),
  updateTask: () => notConfigured("tasks"),
};

const unconfiguredAutomation: AutomationService = {
  listRules: () => notConfigured("automation"),
  toggleRule: () => notConfigured("automation"),
};

const unconfiguredAnalytics: AnalyticsService = {
  getChannelMetrics: () => notConfigured("analytics"),
};

const unconfiguredModeration: ModerationService = {
  listQueue: () => notConfigured("moderation"),
  resolve: () => notConfigured("moderation"),
};

const unconfiguredKb: KnowledgeBaseService = {
  search: () => notConfigured("knowledge_base"),
  getArticle: () => notConfigured("knowledge_base"),
};

const defaultServices: Services = {
  bot: unconfiguredBot,
  payments: unconfiguredPayments,
  translate: unconfiguredTranslate,
  tasks: unconfiguredTasks,
  automation: unconfiguredAutomation,
  analytics: unconfiguredAnalytics,
  moderation: unconfiguredModeration,
  kb: unconfiguredKb,
};

const ServicesContext = createContext<Services>(defaultServices);

export function ServicesProvider({
  children,
  services,
}: {
  children: ReactNode;
  services?: Partial<Services>;
}) {
  const merged: Services = services ? { ...defaultServices, ...services } : defaultServices;
  return <ServicesContext.Provider value={merged}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  return useContext(ServicesContext);
}

export type ServiceDataState<T> =
  | { status: "loading" }
  | { status: "loaded"; data: T }
  | { status: "notConfigured" }
  | { status: "error"; error: string };

export function useServiceData<T>(loader: () => Promise<T>, deps: unknown[] = []): ServiceDataState<T> {
  const [state, setState] = useState<ServiceDataState<T>>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    loader()
      .then((data) => alive && setState({ status: "loaded", data }))
      .catch((e) =>
        alive &&
        setState(
          isServiceNotConfiguredError(e)
            ? { status: "notConfigured" }
            : { status: "error", error: (e as Error).message },
        ),
      );
    return () => {
      alive = false;
    };
  }, deps);
  return state;
}

export function NotConfiguredState({
  isDark,
  feature,
  hint,
}: {
  isDark?: boolean;
  feature: string;
  hint?: string;
}) {
  return (
    <DataState
      status="empty"
      isDark={isDark}
      title="Интеграция не подключена"
      description={
        hint ??
        `Сервис «${feature}» требует бэкенд-адаптера. Подключите его через configureServices() в точке входа приложения.`
      }
    />
  );
}
