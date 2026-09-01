import { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { INTEGRATIONS_PATH } from '../../config/integrations';

export interface IntegrationSummary {
  id: string;
  provider: string;
  name: string;
  status: string;
}

export function IntegrationsPanel({ token }: { token?: string }) {
  const { t } = useI18n();
  const [items, setItems] = useState<IntegrationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(INTEGRATIONS_PATH, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { integrations?: IntegrationSummary[] }) => {
        if (!cancelled) setItems(data.integrations ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="integrations-panel">
      <h3>{t('integrations.title')}</h3>
      {error && <p role="alert">{error}</p>}
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            {it.name} — {it.provider} ({it.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
