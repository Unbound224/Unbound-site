'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { apiBaseUrl, createClient, type Client } from '@/lib/api/client';

interface Session {
  /** In-memory only: cleared on reload or sign-out. Never written to storage or cookies. */
  token: string | null;
  signedIn: boolean;
  setToken(t: string | null): void;
  client(): Client;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children, makeClient, initialToken = null }: { children: ReactNode; makeClient?: (token: string | null) => Client; initialToken?: string | null }) {
  const [token, setToken] = useState<string | null>(initialToken);
  const client = useCallback(
    () => (makeClient ? makeClient(token) : createClient({ baseUrl: apiBaseUrl(), ...(token ? { token } : {}) })),
    [makeClient, token],
  );
  const value = useMemo<Session>(() => ({ token, signedIn: token !== null, setToken, client }), [token, client]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used inside <SessionProvider>');
  return v;
}
