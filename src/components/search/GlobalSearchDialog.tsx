/**
 * Presentational dialog body of the global search. The query state, history and
 * selection logic live in `GlobalSearch`; this file renders the portal UI and
 * stays under the 300-line audit budget.
 */

import React from "react";
import { createPortal } from "react-dom";
import { Search, X, Clock } from "lucide-react";
import { DataState } from "../ui/DataState";
import { FilterChip, SearchResultSections } from "./SearchResults";
import {
  DATE_FILTERS,
  SENDER_FILTERS,
  TYPE_FILTERS,
  type DateFilter,
  type SenderFilter,
  type TypeFilter,
} from "./searchEngine";
import { StoriesStrip } from "../../features/stories/components/StoriesStrip";

/** Caps label above a global search section. */
const SECTION_LABEL_CLASS = 'mr-1 text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)]';

type T = (key: string, fallback?: string) => string;

interface GlobalSearchDialogProps {
  isDark: boolean;
  t: T;
  query: string;
  onQueryChange: (q: string) => void;
  dateFilter: DateFilter;
  onDateFilter: (f: DateFilter) => void;
  senderFilter: SenderFilter;
  onSenderFilter: (f: SenderFilter) => void;
  typeFilter: TypeFilter;
  onTypeFilter: (f: TypeFilter) => void;
  hasQuery: boolean;
  isEmpty: boolean;
  contacts: any[];
  history: string[];
  onClearQuery: () => void;
  onClearHistory: () => void;
  activeIndex: number;
  rowRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onSelectContact: (c: any) => void;
  results: any;
  onSelectChat: (chat: any, messageId?: number | null) => void;
  onSelectChannel: (chat: any, messageId?: number | null) => void;
}

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({
  isDark, t, query, onQueryChange, dateFilter, onDateFilter, senderFilter,
  onSenderFilter, typeFilter, onTypeFilter, hasQuery, isEmpty, contacts, history,
  onClearQuery, onClearHistory, activeIndex, rowRefs, inputRef, onKeyDown, onClose,
  onSelectContact, results, onSelectChat, onSelectChannel,
}) => {
  return createPortal(
    <div className="fixed inset-0 z-[var(--z-drawer)] flex items-start justify-center p-3 sm:p-6 pt-[8vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-label={t("search.title", "Search")}
        className="glass-panel relative w-full max-w-[560px] rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-color)]">
          <Search size={18} className="text-[var(--text-tertiary)]" />
          <input
            aria-label={t("search.placeholder", "Search chats, messages, contacts…")}
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("search.placeholder", "Search chats, messages, contacts…")}
            className="flex-1 bg-transparent outline-none text-xs py-1 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
          {query && (
            <button
              type="button"
              aria-label={t("search.clear", "Clear")}
              onClick={onClearQuery}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-[var(--msg-bg-panel-hover)]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {hasQuery && (
          <div className="flex flex-col gap-1.5 px-2 py-2 border-b border-[var(--border-color)]">
            <div className="flex flex-wrap items-center gap-1.5">
              {DATE_FILTERS.map((f) => (
                <FilterChip
                  key={f.value}
                  label={t(f.key, f.fallback)}
                  active={dateFilter === f.value}
                  onClick={() => onDateFilter(f.value)}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={SECTION_LABEL_CLASS}>{t("search.senderFilters.from", "From")}</span>
              {SENDER_FILTERS.map((f) => (
                <FilterChip
                  key={f.value}
                  label={t(f.key, f.fallback)}
                  active={senderFilter === f.value}
                  onClick={() => onSenderFilter(f.value)}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={SECTION_LABEL_CLASS}>{t("search.typeFilters.type", "Type")}</span>
              {TYPE_FILTERS.map((f) => (
                <FilterChip
                  key={f.value}
                  label={t(f.key, f.fallback)}
                  active={typeFilter === f.value}
                  onClick={() => onTypeFilter(f.value)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-2">
          {!hasQuery && (
            <>
              <StoriesStrip t={t} />
              {contacts.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                      {t("search.frequent", "Frequent contacts")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto px-1 no-scrollbar">
                    {contacts.slice(0, 6).map((c: any) => (
                      <button
                        key={c.id ?? c.name}
                        type="button"
                        onClick={() => onSelectContact(c)}
                        className="shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
                        style={{ width: 64 }}
                      >
                        <span
                          className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br text-lg font-bold text-white ${c.avatarColor ?? 'from-[var(--accent)] to-[var(--accent2)]'}`}
                        >
                          {String(c.name ?? '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="w-full truncate text-center text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                          {c.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!hasQuery && history.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
                  <Clock size={12} />
                  {t("search.history", "Recent searches")}
                </div>
                <button
                  type="button"
                  aria-label={t("search.historyClear", "Clear history")}
                  onClick={onClearHistory}
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-full cursor-pointer hover:bg-[var(--msg-bg-panel-hover)]"
                >
                  <X size={12} />
                </button>
              </div>
              {history.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onQueryChange(h)}
                  className="w-full flex items-center gap-3 px-3 min-h-11 rounded-xl text-left text-sm cursor-pointer text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/[0.05]"
                >
                  <Clock size={14} className="text-[var(--text-tertiary)]" />
                  <span className="truncate">{h}</span>
                </button>
              ))}
            </div>
          )}

          {!hasQuery && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 opacity-60 text-sm text-[var(--text-tertiary)]">
              <Search size={32} className="mb-3" />
              {t("search.hint", "Search across all chats, channels and contacts")}
            </div>
          )}

          {isEmpty && (
            <DataState
              status="empty"
              emptyIcon="search"
              title={t("search.noResults", "Nothing found")}
              description={t("search.noResultsHint", "Try a different keyword")}
              action={{ label: t("search.clear", "Clear"), onClick: onClearQuery }}
            />
          )}

          <SearchResultSections
            results={results}
            q={query.toLowerCase().trim()}
            activeIndex={activeIndex}
            rowRefs={rowRefs}
            t={t}
            onSelectChat={onSelectChat}
            onSelectChannel={onSelectChannel}
            onSelectContact={onSelectContact}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
