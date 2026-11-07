'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { apiBaseUrl, createClient, type Client } from '@/lib/api/client';

export type Role = 'user' | 'merchant' | 'admin';

interface Session {
  /** In-memory only: cleared on reload or sign-out. Never written to storage or cookies. */
  token: string | null;
  /** role reported by core at sign-in; the server still enforces every permission */
  role: Role | null;
  signedIn: boolean;
  setToken(t: string | null, role?: Role | null): void;
  client(): Client;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({
  children,
  makeClient,
  initialToken = null,
  initialRole = null,
}: {
  children: ReactNode;
  makeClient?: (token: string | null) => Client;
  initialToken?: string | null;
  initialRole?: Role | null;
}) {
  const [state, setState] = useState<{ token: string | null; role: Role | null }>({ token: initialToken, role: initialToken ? (initialRole ?? 'merchant') : null });
  const { token, role } = state;
  const client = useCallback(
    () => (makeClient ? makeClient(token) : createClient({ baseUrl: apiBaseUrl(), ...(token ? { token } : {}) })),
    [makeClient, token],
  );
  const setToken = useCallback((t: string | null, r: Role | null = null) => setState({ token: t, role: t ? (r ?? 'merchant') : null }), []);
  const value = useMemo<Session>(() => ({ token, role, signedIn: token !== null, setToken, client }), [token, role, setToken, client]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used inside <SessionProvider>');
  return v;
}
