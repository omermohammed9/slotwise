import { useSyncExternalStore } from 'react';

type SessionSnapshot = {
  token: string | null;
  setToken: (token: string | null) => void;
};

let memoryToken: string | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getTokenSnapshot(): string | null {
  return memoryToken;
}

function setToken(token: string | null) {
  memoryToken = token;
  emitChange();
}

export function useSessionStore(): SessionSnapshot {
  const token = useSyncExternalStore(subscribe, getTokenSnapshot, getTokenSnapshot);

  return {
    token,
    setToken,
  };
}
