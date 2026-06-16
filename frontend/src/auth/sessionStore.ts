import { useSyncExternalStore } from 'react';
import type { SessionDto } from '../api/types';

export type SessionNotice = {
  message: string;
  tone: 'error' | 'success';
};

type SessionSnapshot = {
  token: string | null;
  session: SessionDto | null;
  notice: SessionNotice | null;
  clearNotice: () => void;
  clearSession: () => void;
  setNotice: (notice: SessionNotice | null) => void;
  setSession: (session: SessionDto | null) => void;
  setToken: (token: string | null) => void;
};

function createMemorySessionStore(seedSession: SessionDto | null = null) {
  let memorySession = seedSession;
  let notice: SessionNotice | null = null;
  const listeners = new Set<() => void>();

  function emitChange() {
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot(): SessionDto | null {
    return memorySession;
  }

  function getNoticeSnapshot(): SessionNotice | null {
    return notice;
  }

  function setSession(session: SessionDto | null) {
    memorySession = session;
    if (session) {
      notice = null;
    }
    emitChange();
  }

  function setNotice(nextNotice: SessionNotice | null) {
    notice = nextNotice;
    emitChange();
  }

  function clearNotice() {
    setNotice(null);
  }

  function clearSession() {
    memorySession = null;
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

  function useStore(): SessionSnapshot {
    const session = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const currentNotice = useSyncExternalStore(subscribe, getNoticeSnapshot, getNoticeSnapshot);

    return {
      clearNotice,
      clearSession,
      notice: currentNotice,
      session,
      setNotice,
      setSession,
      setToken,
      token: session?.token ?? null,
    };
  }

  return {
    clearNotice,
    clearSession,
    getSnapshot,
    getNoticeSnapshot,
    setNotice,
    setSession,
    setToken,
    useStore,
  };
}

const operatorMemoryStore = createMemorySessionStore();
const customerMemoryStore = createMemorySessionStore();

export function useSessionStore(): SessionSnapshot {
  return operatorMemoryStore.useStore();
}

export function useCustomerSessionStore(): SessionSnapshot {
  return customerMemoryStore.useStore();
}

export const sessionStore = operatorMemoryStore;
export const customerSessionStore = customerMemoryStore;
