import { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';

export function IntegrationHealthPanel({
  integrationId,
  token,
}: {
  integrationId: string;
  token?: string;
}) {
  const [health, setHealth] = useState<string>('unknown');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/integrations/${integrationId}/health`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { health?: string }) => {
        if (!cancelled) setHealth(d.health ?? 'unknown');
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
    <div className="integration-health-panel">
      <h4>{t('integrations.health')}</h4>
      {error && <p role="alert">{error}</p>}
      <p>{health}</p>
    </div>
  );
}
