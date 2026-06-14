import { useSyncExternalStore } from 'react';
import type { SessionDto } from '../api/types';

type SessionSnapshot = {
  token: string | null;
  session: SessionDto | null;
  clearSession: () => void;
  setSession: (session: SessionDto | null) => void;
  setToken: (token: string | null) => void;
};

let memorySession: SessionDto | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSessionSnapshot(): SessionDto | null {
  return memorySession;
}

function setSession(session: SessionDto | null) {
  memorySession = session;
  emitChange();
}

function setToken(token: string | null) {
  setSession(
    token
      ? {
          actorId: 'demo-operator',
          role: 'owner',
          token,
        }
      : null,
  );
}

function clearSession() {
  setSession(null);
}

export function useSessionStore(): SessionSnapshot {
  const session = useSyncExternalStore(subscribe, getSessionSnapshot, getSessionSnapshot);

  return {
    clearSession,
    session,
    setSession,
    setToken,
    token: session?.token ?? null,
  };
}

export const sessionStore = {
  clearSession,
  getSnapshot: getSessionSnapshot,
  setSession,
};
