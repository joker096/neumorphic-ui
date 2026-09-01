import { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { INTEGRATIONS_PATH, integrationPath } from '../../config/integrations';

export function IntegrationConnectForm({
  token,
  onConnected,
}: {
  token?: string;
  onConnected?: () => void;
}) {
  const [provider, setProvider] = useState('amocrm');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  async function connect() {
    setError(null);
    try {
      const createRes = await fetch(INTEGRATIONS_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          provider,
          name,
          config: { baseUrl },
          credentials: { apiKey },
        }),
      });
      if (!createRes.ok) throw new Error(`create HTTP ${createRes.status}`);
      const created: { integration?: { id: string }; id?: string } = await createRes.json();
      const id = created.integration?.id ?? created.id;
      if (!id) throw new Error('no integration id');
      const connRes = await fetch(integrationPath('connect', id), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!connRes.ok) throw new Error(`connect HTTP ${connRes.status}`);
      onConnected?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <form
      className="integration-connect-form"
      onSubmit={(e) => {
        e.preventDefault();
        void connect();
      }}
    >
      <label>
        {t('integrations.provider')}{' '}
        <input value={provider} onChange={(e) => setProvider(e.target.value)} />
      </label>
      <label>
        {t('integrations.name')} <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        {t('integrations.baseUrl')}{' '}
        <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
      </label>
      <label>
        {t('integrations.apiKey')}{' '}
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">{t('integrations.connect')}</button>
    </form>
  );
}
