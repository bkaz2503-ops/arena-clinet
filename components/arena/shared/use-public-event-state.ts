"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UsePublicEventStateOptions<TState> = {
  pin: string;
  onState: (state: TState) => void;
  onError: (message: string | null) => void;
  onLoading?: (value: boolean) => void;
};

export function usePublicEventState<TState>({
  pin,
  onState,
  onError,
  onLoading
}: UsePublicEventStateOptions<TState>) {
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const latestRequestIdRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const lastSnapshotRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);

  const loadState = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const requestId = ++latestRequestIdRef.current;
      const shouldShowLoading = !silent && !hasLoadedOnceRef.current;

      try {
        if (shouldShowLoading) {
          onLoading?.(true);
        }

        const response = await fetch(`/api/leaderboard/${pin}`, {
          cache: "no-store"
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load public event state.");
        }

        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        const nextSnapshot = JSON.stringify(data.item);

        if (nextSnapshot !== lastSnapshotRef.current) {
          lastSnapshotRef.current = nextSnapshot;
          onState(data.item as TState);
        }

        hasLoadedOnceRef.current = true;
        onError(null);
      } catch (error) {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        if (!hasLoadedOnceRef.current) {
          onError(
            error instanceof Error
              ? error.message
              : "Failed to load public event state."
          );
        }
      } finally {
        if (shouldShowLoading && requestId === latestRequestIdRef.current) {
          onLoading?.(false);
        }
      }
    },
    [onError, onLoading, onState, pin]
  );

  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshTimeoutRef.current = null;
      void loadState({ silent: true });
    }, 120);
  }, [loadState]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    const source = new EventSource(`/api/realtime/${pin}`);
    let isClosed = false;

    source.onopen = () => {
      setRealtimeConnected(true);
    };

    source.addEventListener("connected", () => {
      setRealtimeConnected(true);
    });

    source.addEventListener("event:lobby", scheduleRefresh);
    source.addEventListener("question:launched", scheduleRefresh);
    source.addEventListener("answer:revealed", scheduleRefresh);
    source.addEventListener("leaderboard:updated", scheduleRefresh);
    source.addEventListener("event:finished", scheduleRefresh);
    source.addEventListener("participant:joined", scheduleRefresh);
    source.addEventListener("answer:submitted", scheduleRefresh);

    source.onerror = () => {
      if (!isClosed) {
        setRealtimeConnected(false);
      }
    };

    return () => {
      isClosed = true;
      source.close();
    };
  }, [pin, scheduleRefresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadState({ silent: true });
    }, realtimeConnected ? 5000 : 2000);

    return () => window.clearInterval(interval);
  }, [loadState, realtimeConnected]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    loadState,
    realtimeConnected
  };
}
