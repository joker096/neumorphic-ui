import { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { integrationPath } from '../../config/integrations';

export interface MappingRow {
  sourceField: string;
  targetField: string;
  transform?: string;
}

export function IntegrationMappingEditor({
  integrationId,
  token,
}: {
  integrationId: string;
  token?: string;
}) {
  const [rows, setRows] = useState<MappingRow[]>([
    { sourceField: 'name', targetField: 'name', transform: 'trim' },
  ]);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, key: keyof MappingRow, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }

  async function save() {
    setError(null);
    try {
      const res = await fetch(integrationPath('mappings', integrationId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const { t } = useI18n();

  return (
    <div className="integration-mapping-editor">
      <h4>{t('integrations.mappings')}</h4>
      {rows.map((r, i) => (
        <div key={i}>
          <input
            value={r.sourceField}
            onChange={(e) => update(i, 'sourceField', e.target.value)}
          />
          <input
            value={r.targetField}
            onChange={(e) => update(i, 'targetField', e.target.value)}
          />
          <input
            value={r.transform ?? ''}
            onChange={(e) => update(i, 'transform', e.target.value)}
          />
        </div>
      ))}
      <button onClick={() => void save()}>{t('common.save')}</button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
