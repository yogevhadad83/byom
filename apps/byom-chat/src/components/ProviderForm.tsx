import { useState } from 'react';
import { useAuth } from '../store/auth';
import { useProvider, registerProvider, disconnectProvider } from '../store/provider';

export function ProviderForm() {
  const [provider, setProvider] = useState<'openai' | 'http'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [status, setStatus] = useState('');
  const auth = useAuth();
  const providerState = useProvider();

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
      setStatus(e.message || String(e));
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
          value={providerState.connected && providerState.maskedConfig?.apiKey ? (providerState.maskedConfig.apiKey as string) : apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={providerState.connected}
        />
        <input
          className="p-2 bg-gray-700 text-white rounded flex-1"
          placeholder="Model"
          value={providerState.connected && providerState.maskedConfig?.model ? (providerState.maskedConfig.model as string) : model}
          onChange={(e) => setModel(e.target.value)}
          disabled={providerState.connected}
        />
        <input
          className="p-2 bg-gray-700 text-white rounded flex-1"
          placeholder="Endpoint"
          value={providerState.connected && providerState.maskedConfig?.endpoint ? (providerState.maskedConfig.endpoint as string) : endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          disabled={providerState.connected}
        />
      </div>
      <input
        className="p-2 bg-gray-700 text-white rounded"
        placeholder="System Prompt"
        value={providerState.connected && providerState.maskedConfig?.systemPrompt ? (providerState.maskedConfig.systemPrompt as string) : systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        disabled={providerState.connected}
      />
      <div className="flex gap-2">
        <button
          className="self-start px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          onClick={onSubmit}
          disabled={!auth.session}
          title={!auth.session ? 'Log in to use your model' : undefined}
        >
          {providerState.connected ? 'Update' : 'Use my model'}
        </button>
        {providerState.connected && (
          <button
            className="self-start px-3 py-2 bg-red-600 text-white rounded"
            onClick={() => disconnectProvider()}
          >
            Disconnect
          </button>
        )}
      </div>
      {status && <p className="text-sm text-gray-300">{status}</p>}
    </div>
  );
}
