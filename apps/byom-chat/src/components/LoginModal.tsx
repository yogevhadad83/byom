import { useEffect, useState } from 'react';
import { useAuth, signIn, signUp, signOut } from '../store/auth';

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.user && open) onClose();
  }, [auth.user, open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-[min(92vw,420px)] rounded-xl bg-white p-5 text-gray-900 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Log in</h2>
          <button className="p-1 rounded hover:bg-gray-100" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {!auth.user ? (
          <div className="space-y-3">
            <input
              className="border rounded px-3 py-2 w-full"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2 w-full"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 rounded bg-blue-600 text-white"
                onClick={async () => {
                  setError(null);
                  try {
                    await signIn(email, password);
                  } catch (e: any) {
                    setError(e.message || String(e));
                  }
                }}
              >
                Sign in
              </button>
              <button
                className="px-3 py-2 rounded bg-green-600 text-white"
                onClick={async () => {
                  setError(null);
                  try {
                    await signUp(email, password);
                  } catch (e: any) {
                    setError(e.message || String(e));
                  }
                }}
              >
                Sign up
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm">Signed in as <strong>{auth.user.email}</strong></div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={onClose}>Close</button>
              <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={() => signOut()}>Sign out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
