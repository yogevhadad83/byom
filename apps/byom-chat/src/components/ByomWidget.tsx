import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../store/auth';
import { useProvider, registerProvider, disconnectProvider } from '../store/provider';
import type { Message, ProviderName, ProviderConfig } from '../types';
import { api } from '../lib/api';
import { createPortal } from 'react-dom';

export type ByomWidgetProps = {
  getSnapshot: () => Message[];
  getPrompt: () => string;
  onAssistantMessage: (msg: { text: string; meta?: { modelId?: string } }) => void;
  onUserPrompt?: (text: string) => void;
  buttonLogoSrc?: string;
  buttonAriaLabel?: string;
};

export function ByomWidget({
  getSnapshot,
  getPrompt,
  onAssistantMessage,
  onUserPrompt,
  buttonLogoSrc,
  buttonAriaLabel = 'BYOM',
}: ByomWidgetProps) {
  const auth = useAuth();
  const provider = useProvider();
  const [open, setOpen] = useState(false);
  const [providerName, setProviderName] = useState<ProviderName>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [editing, setEditing] = useState(false);
  const disabled = !auth.session;

  // Pre-fill masked config if connected
  useEffect(() => {
    if (provider.connected && provider.maskedConfig && !editing) {
      setApiKey(provider.maskedConfig.apiKey || '');
      setModel(provider.maskedConfig.model || '');
      setEndpoint(provider.maskedConfig.endpoint || '');
      setSystemPrompt(provider.maskedConfig.systemPrompt || '');
    }
  }, [provider.connected, provider.maskedConfig, editing]);

  async function handleRegister() {
    try {
      if (!auth.session) throw new Error('Please log in');
      await registerProvider({
        provider: providerName,
        config: { apiKey, model, endpoint, systemPrompt },
      });
      setOpen(false);
      try { window.alert('Model connected'); } catch {}
    } catch (e: any) {
      try { window.alert(e?.message || 'Failed to connect'); } catch {}
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectProvider();
      setEditing(false);
      setOpen(false);
    } catch (e: any) {
      try { window.alert(e?.message || 'Failed to disconnect'); } catch {}
    }
  }

  async function handleInvoke() {
    try {
      if (!auth.session) throw new Error('Please log in');
      if (!provider.connected) {
        setOpen(true);
        return;
      }
      const prompt = getPrompt();
      onUserPrompt?.(prompt);
      const payload = {
        prompt,
        conversation: getSnapshot().slice(-50),
      };
      const res = await api.post<{ reply: string; meta?: { modelId?: string } }>(
        '/chat',
        payload
      );
      onAssistantMessage({ text: res.reply, meta: res.meta });
    } catch (e: any) {
      onAssistantMessage({ text: String(e?.message || e) });
    }
  }

  // Button-only view
  if (!open) {
    const connected = provider.connected;
    return (
      <button
        className={`group relative flex items-center justify-center overflow-hidden rounded-full border border-white/70 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/70 transition-all duration-200 w-8 h-8 hover:w-32 ${
          connected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white/90'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={disabled ? undefined : handleInvoke}
        aria-label={connected ? 'Send to AI' : buttonAriaLabel}
        title={disabled ? 'Log in to use your model' : connected ? 'Send to AI' : buttonAriaLabel}
      >
        {buttonLogoSrc ? (
          <img src={buttonLogoSrc} alt={buttonAriaLabel} className="w-5 h-5 object-contain" />
        ) : (
          <span className="text-xs">{connected ? 'AI' : 'Ask'}</span>
        )}
        <span className="ml-2 text-xs text-gray-900 whitespace-nowrap opacity-0 group-hover:opacity-100">
          {connected ? 'Send to AI' : 'BYOM'}
        </span>
      </button>
    );
  }

  // Modal view for register/update
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-[min(92vw,520px)] max-h-[85vh] overflow-auto rounded-xl bg-white text-gray-900 shadow-2xl ring-1 ring-black/10">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold">Bring Your Own Model</h3>
          <button className="p-1 rounded hover:bg-gray-100" onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block text-sm font-medium">Provider</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value as ProviderName)}
            disabled={provider.connected && !editing}
          >
            <option value="openai">OpenAI</option>
            <option value="http">HTTP</option>
          </select>

          <input
            className="border rounded px-2 py-1 w-full"
            placeholder="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={provider.connected && !editing}
          />
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder="Model (e.g. gpt-4o-mini)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={provider.connected && !editing}
          />
          {providerName === 'http' && (
            <input
              className="border rounded px-2 py-1 w-full"
              placeholder="HTTP Endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              disabled={provider.connected && !editing}
            />
          )}
          <textarea
            className="border rounded px-2 py-2 w-full min-h-24"
            placeholder="Optional system prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            disabled={provider.connected && !editing}
          />
        </div>
        <div className="px-5 py-4 border-t border-gray-200 flex justify-between gap-2">
          {provider.connected ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Connected{provider.maskedConfig?.model ? `: ${provider.maskedConfig.model}` : ''}</span>
              {!editing ? (
                <button className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setEditing(true)}>
                  Update
                </button>
              ) : (
                <button className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {provider.connected ? (
              editing ? (
                <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleRegister} disabled={!auth.session}>
                  Save
                </button>
              ) : (
                <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={handleDisconnect}>
                  Disconnect
                </button>
              )
            ) : (
              <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleRegister} disabled={!auth.session}>
                Register
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

