"use client";

import { useCallback, useEffect, useState } from "react";

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

  const loadState = useCallback(async () => {
    try {
      onLoading?.(true);
      const response = await fetch(`/api/leaderboard/${pin}`, {
        cache: "no-store"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load public event state.");
      }

      onState(data.item as TState);
      onError(null);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Failed to load public event state."
      );
    } finally {
      onLoading?.(false);
    }
  }, [onError, onLoading, onState, pin]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    const source = new EventSource(`/api/realtime/${pin}`);

    source.addEventListener("connected", () => {
      setRealtimeConnected(true);
    });

    const refetch = () => {
      void loadState();
    };

    source.addEventListener("event:lobby", refetch);
    source.addEventListener("question:launched", refetch);
    source.addEventListener("answer:revealed", refetch);
    source.addEventListener("leaderboard:updated", refetch);
    source.addEventListener("event:finished", refetch);
    source.addEventListener("answer:submitted", refetch);

    source.onerror = () => {
      setRealtimeConnected(false);
      source.close();
    };

    return () => {
      source.close();
    };
  }, [loadState, pin]);

  useEffect(() => {
    if (realtimeConnected) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadState();
    }, 2000);

    return () => window.clearInterval(interval);
  }, [loadState, realtimeConnected]);

  return {
    loadState,
    realtimeConnected
  };
}
