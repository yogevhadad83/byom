import { useState } from 'react';
import { useBYOM } from '@byom/sdk';
import { useAuth } from '../store/auth';

export function ProviderForm({ userId }: { userId: string }) {
  const { registerProvider } = useBYOM();
  const [provider, setProvider] = useState<'openai' | 'http'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [status, setStatus] = useState('');
  const auth = useAuth();

  async function onSubmit() {
    try {
      if (!auth.session) {
        setStatus('Please log in');
        return;
      }
  await registerProvider({
        provider,
        config: { apiKey, model, endpoint, systemPrompt },
      });
  setStatus('Model connected');
  try { window.alert('Model connected'); } catch {}
    } catch (e: any) {
      setStatus(e.message);
    }
  }

  return (
    <div className="p-4 bg-gray-800 flex flex-col gap-2">
      <div className="flex gap-2">
        <select
          className="p-2 bg-gray-700 text-white rounded"
          value={provider}
          onChange={(e) => setProvider(e.target.value as 'openai' | 'http')}
        >
          <option value="openai">OpenAI</option>
          <option value="http">HTTP</option>
        </select>
        <input
          className="p-2 bg-gray-700 text-white rounded flex-1"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <input
          className="p-2 bg-gray-700 text-white rounded flex-1"
          placeholder="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <input
          className="p-2 bg-gray-700 text-white rounded flex-1"
          placeholder="Endpoint"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
        />
      </div>
      <input
        className="p-2 bg-gray-700 text-white rounded"
        placeholder="System Prompt"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
      />
      <button
        className="self-start px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        onClick={onSubmit}
        disabled={!auth.session}
        title={!auth.session ? 'Log in to use your model' : undefined}
      >
        Use my model
      </button>
      {status && <p className="text-sm text-gray-300">{status}</p>}
    </div>
  );
}
