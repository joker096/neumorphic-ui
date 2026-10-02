import { useState } from "react";
import { Plus, CheckCheck, Search } from "lucide-react";
import { useI18n } from "../../../lib/i18n";
import { useServices, useServiceData, NotConfiguredState } from "../../../services";
import { DataState } from "../../ui/DataState";
import { Skeleton } from "../../ui/Skeleton";
import { Panel, reportServiceError } from "./shared";

export function TasksTab({ isDark }: { isDark?: boolean }) {
  const { t } = useI18n();
  const { tasks } = useServices();
  const state = useServiceData(() => tasks.listTasks(), []);
  const [title, setTitle] = useState("");

  if (state.status === "notConfigured") {
    return <NotConfiguredState isDark={isDark} feature="tasks" />;
  }
  if (state.status === "error") {
    return <DataState status="error" isDark={isDark} title={t('workplace.tasksError')} description={state.error} />;
  }

  return (
    <Panel>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          try {
            await tasks.createTask({ title });
            setTitle("");
          } catch {
            reportServiceError(t);
          }
        }}
      >
        <input
          aria-label={t('workplace.newTask')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('workplace.newTask')}
          className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-transparent"
        />
        <button type="submit" className="min-w-11 min-h-11 flex items-center justify-center rounded-xl bg-[var(--accent)] text-white" aria-label={t('workplace.add')}>
          <Plus size={18} />
        </button>
      </form>
      {state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.noTasks')} description={t('workplace.createFirstTask')} />
      ) : (
        state.data.map((task) => (
          <label key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border-color)]">
            <input type="checkbox" checked={task.done} onChange={() => tasks.updateTask(task.id, { done: !task.done }).catch(() => reportServiceError(t))} />
            <span className={task.done ? "line-through opacity-60" : ""}>{task.title}</span>
            {task.assignee && <span className="ml-auto text-xs opacity-60">{task.assignee}</span>}
          </label>
        ))
      )}
    </Panel>
  );
}

export function AutomationTab({ isDark }: { isDark?: boolean }) {
  const { t } = useI18n();
  const { automation } = useServices();
  const state = useServiceData(() => automation.listRules(), []);

  if (state.status === "notConfigured") return <NotConfiguredState isDark={isDark} feature="automation" />;
  if (state.status === "error") return <DataState status="error" isDark={isDark} title={t('workplace.automationError')} description={state.error} />;

  return (
    <Panel>
      {state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.noRules')} description={t('workplace.addRules')} />
      ) : (
        state.data.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border-color)]">
            <div className="flex-1">
              <div className="font-semibold text-sm">{r.name}</div>
              <div className="text-xs opacity-60">{r.trigger} → {r.action}</div>
            </div>
            <input type="checkbox" checked={r.enabled} onChange={() => automation.toggleRule(r.id, !r.enabled).catch(() => reportServiceError(t))} aria-label={t('workplace.on')} />
          </div>
        ))
      )}
    </Panel>
  );
}

export function AnalyticsTab({ isDark, channelId }: { isDark?: boolean; channelId: string }) {
  const { t } = useI18n();
  const { analytics } = useServices();
  const state = useServiceData(() => analytics.getChannelMetrics(channelId), [channelId]);

  if (state.status === "notConfigured") return <NotConfiguredState isDark={isDark} feature="analytics" />;
  if (state.status === "error") return <DataState status="error" isDark={isDark} title={t('workplace.analyticsError')} description={state.error} />;

  const max = state.status === "loaded" ? Math.max(1, ...state.data.map((m) => m.value)) : 1;
  return (
    <Panel>
      {state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.noData')} description={t('workplace.metricsAppear')} />
      ) : (
        state.data.map((m) => (
          <div key={m.label} className="px-3 py-2 rounded-xl border border-[var(--border-color)]">
            <div className="flex justify-between text-sm mb-1">
              <span>{m.label}</span>
              <span className="opacity-70">{m.value}</span>
            </div>
            <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-[var(--accent)]" style={{ width: `${(m.value / max) * 100}%` }} />
            </div>
          </div>
        ))
      )}
    </Panel>
  );
}

export function ModerationTab({ isDark }: { isDark?: boolean }) {
  const { t } = useI18n();
  const { moderation } = useServices();
  const state = useServiceData(() => moderation.listQueue(), []);

  if (state.status === "notConfigured") return <NotConfiguredState isDark={isDark} feature="moderation" />;
  if (state.status === "error") return <DataState status="error" isDark={isDark} title={t('workplace.moderationError')} description={state.error} />;

  return (
    <Panel>
      {state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.queueEmpty')} description={t('workplace.complaintsHere')} />
      ) : (
        state.data.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border-color)]">
            <span className="text-xs uppercase opacity-60">{item.type}</span>
            <span className="flex-1 text-sm">{item.summary}</span>
            <button
              onClick={() => moderation.resolve(item.id).catch(() => reportServiceError(t))}
              aria-label={t('workplace.resolve')}
              title={t('workplace.resolve')}
              className="w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-[var(--accent)] text-white text-xs"
            >
              <CheckCheck size={18} />
              <span className="sr-only">{t('workplace.resolve')}</span>
            </button>
          </div>
        ))
      )}
    </Panel>
  );
}

export function KbTab({ isDark }: { isDark?: boolean }) {
  const { t } = useI18n();
  const { kb } = useServices();
  const [q, setQ] = useState("");
  const state = useServiceData(() => (q.trim() ? kb.search(q) : Promise.resolve([])), [q]);

  if (state.status === "notConfigured") return <NotConfiguredState isDark={isDark} feature="knowledge_base" />;
  if (state.status === "error") return <DataState status="error" isDark={isDark} title={t('workplace.kbError')} description={state.error} />;

  return (
    <Panel>
      <div className="flex items-center gap-2 px-3 rounded-xl border border-[var(--border-color)]">
        <Search size={16} className="opacity-60" />
        <input
          aria-label={t('workplace.searchKb')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('workplace.searchKb')}
          className="flex-1 bg-transparent py-2 outline-none"
        />
      </div>
      {q.trim() === "" ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.enterQuery')} description={t('workplace.searchKbArticles')} />
      ) : state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} emptyIcon="search" title={t('workplace.nothingFound')} description={t('workplace.nothingFoundHint')} />
      ) : (
        state.data.map((a) => (
          <article key={a.id} className="px-3 py-2 rounded-xl border border-[var(--border-color)]">
            <h4 className="font-semibold text-sm">{a.title}</h4>
            <p className="text-xs opacity-70 line-clamp-2">{a.body}</p>
          </article>
        ))
      )}
    </Panel>
  );
}
