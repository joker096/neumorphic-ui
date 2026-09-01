import { useState } from 'react';
import { useI18n } from '../../lib/i18n';

export function IntegrationImportPanel({
  integrationId,
  token,
}: {
  integrationId: string;
  token?: string;
}) {
  const [entityType, setEntityType] = useState('contact');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  async function run() {
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/v1/integrations/${integrationId}/imports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ entityType, records: [] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { jobId?: string } = await res.json();
      setResult(data.jobId ?? 'queued');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="integration-import-panel">
      <h4>{t('integrations.import')}</h4>
      <label>
        {t('integrations.entity')}{' '}
        <input
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />
      </label>
      <button onClick={() => void run()}>{t('integrations.runImport')}</button>
      {result && <p>job: {result}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
