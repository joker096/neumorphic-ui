import { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';

export interface AuditRow {
  action: string;
  entityType?: string;
  status: string;
  createdAt?: string;
}

export function IntegrationLogsPanel({
  integrationId,
  token,
}: {
  integrationId: string;
  token?: string;
}) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/integrations/${integrationId}/logs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { logs?: AuditRow[] }) => {
        if (!cancelled) setRows(d.logs ?? []);
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
    <div className="integration-logs-panel">
      <h4>{t('integrations.logs')}</h4>
      {error && <p role="alert">{error}</p>}
      <ul>
        {rows.map((l, i) => (
          <li key={i}>
            {l.action} {l.entityType ?? ''} ({l.status}) {l.createdAt ?? ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
