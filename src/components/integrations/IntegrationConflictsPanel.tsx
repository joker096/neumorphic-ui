import { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { integrationPath } from '../../config/integrations';

export interface ConflictRow {
  id: string;
  entityType: string;
  field: string;
  localValue: unknown;
  externalValue: unknown;
  status: string;
}

export function IntegrationConflictsPanel({
  integrationId,
  token,
}: {
  integrationId: string;
  token?: string;
}) {
  const [rows, setRows] = useState<ConflictRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(integrationPath('conflicts', integrationId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { conflicts?: ConflictRow[] }) => {
        if (!cancelled) setRows(data.conflicts ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [integrationId, token]);

  const { t } = useI18n();

  return (
    <div className="integration-conflicts-panel">
      <h4>{t('integrations.conflicts')}</h4>
      {error && <p role="alert">{error}</p>}
      <ul>
        {rows.map((c) => (
          <li key={c.id}>
            {c.entityType}.{c.field}: local={JSON.stringify(c.localValue)} external=
            {JSON.stringify(c.externalValue)} ({c.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
