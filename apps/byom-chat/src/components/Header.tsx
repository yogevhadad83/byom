import { useEffect, useState } from 'react';
import { useAuth, signOut, consumeUnauthorizedFlag } from '../store/auth';
import { LoginModal } from './LoginModal';
import { useProvider } from '../store/provider';

export function Header({
  conversationId,
  connected,
}: {
  conversationId: string;
  connected: boolean;
}) {
  const auth = useAuth();
  const provider = useProvider();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (auth.unauthorized && !open) {
      setOpen(true);
      consumeUnauthorizedFlag();
    }
  }, [auth.unauthorized, open]);
  return (
    <header className="p-4 bg-gray-900 text-white flex justify-between items-center">
      <h1 className="text-xl font-bold">{connected ? `Chat: ${conversationId}` : 'Chat'}</h1>
      <div className="flex items-center gap-3">
        <span
          className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
          title={connected ? 'Connected' : 'Disconnected'}
        />
        {auth.user && provider.connected && (
          <span className="px-2 py-1 text-xs rounded bg-green-600/20 text-green-300 border border-green-600/40">
            {provider.maskedConfig?.model ? `Connected to ${provider.maskedConfig.model}` : 'Connected'}
          </span>
        )}
        {auth.user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-200">{auth.user.email}</span>
            <button
              className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-sm"
            onClick={() => setOpen(true)}
          >
            Log in
          </button>
        )}
      </div>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
