import { useEffect, useRef, useState } from 'react';
import { getCurrentSession } from '../api/auth';
import type { SessionDto } from '../api/types';
import type { SessionNotice } from './sessionStore';

type UseSessionRevalidationOptions = {
  enabled?: boolean;
  invalidMessage: string;
  session: SessionDto | null;
  token: string | null;
  clearSession: () => void;
  setNotice: (notice: SessionNotice | null) => void;
  setSession: (session: SessionDto | null) => void;
};

function isInvalidSessionMessage(message: string): boolean {
  return /authenticated session is required|bearer session token is required/i.test(message);
}

export function useSessionRevalidation({
  enabled = true,
  invalidMessage,
  session,
  token,
  clearSession,
  setNotice,
  setSession,
}: UseSessionRevalidationOptions) {
  const [isInitialCheckPending, setIsInitialCheckPending] = useState(Boolean(enabled && token && session));
  const revalidationInFlightRef = useRef(false);
  const latestStateRef = useRef({
    clearSession,
    enabled,
    invalidMessage,
    session,
    setNotice,
    setSession,
    token,
  });

  latestStateRef.current = {
    clearSession,
    enabled,
    invalidMessage,
    session,
    setNotice,
    setSession,
    token,
  };

  async function revalidateSession(mode: 'initial' | 'refresh') {
    const current = latestStateRef.current;

    if (!current.enabled || !current.token || !current.session) {
      if (mode === 'initial') {
        setIsInitialCheckPending(false);
      }
      return;
    }

    if (revalidationInFlightRef.current) {
      return;
    }

    revalidationInFlightRef.current = true;

    try {
      const response = await getCurrentSession(current.token);

      if (!response.success) {
        if (isInvalidSessionMessage(response.error.message)) {
          current.setNotice({
            message: current.invalidMessage,
            tone: 'error',
          });
          current.clearSession();
        }
        return;
      }

      current.setSession({
        ...response.data,
        token: current.token,
      });
    } catch {
      // Keep the current memory-only session when revalidation cannot reach the API.
    } finally {
      revalidationInFlightRef.current = false;
      if (mode === 'initial') {
        setIsInitialCheckPending(false);
      }
    }
  }

  useEffect(() => {
    setIsInitialCheckPending(Boolean(enabled && token && session));

    if (!enabled || !token || !session) {
      return;
    }

    void revalidateSession('initial');
  }, [enabled, token]);

  useEffect(() => {
    if (!enabled || !token || !session) {
      return;
    }

    function handleFocus() {
      void revalidateSession('refresh');
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void revalidateSession('refresh');
      }
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, token]);

  return {
    isInitialCheckPending,
  };
}
