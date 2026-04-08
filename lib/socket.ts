import { EventEmitter } from "events";

export type RealtimeEventName =
  | "event:lobby"
  | "question:launched"
  | "answer:revealed"
  | "leaderboard:updated"
  | "event:finished"
  | "participant:joined"
  | "answer:submitted";

export type RealtimePayload = {
  type: RealtimeEventName;
  pin: string;
  eventId?: string;
  status?: string;
  currentQuestionIndex?: number;
  questionId?: string;
  participantId?: string;
  timestamp: number;
};

const globalForRealtime = globalThis as typeof globalThis & {
  arenaRealtimeEmitter?: EventEmitter;
};

function getRealtimeEmitter() {
  if (!globalForRealtime.arenaRealtimeEmitter) {
    globalForRealtime.arenaRealtimeEmitter = new EventEmitter();
    globalForRealtime.arenaRealtimeEmitter.setMaxListeners(100);
  }

  return globalForRealtime.arenaRealtimeEmitter;
}

function getEventKey(pin: string) {
  return `arena:${pin}`;
}

export function emitRealtimeEvent(payload: RealtimePayload) {
  getRealtimeEmitter().emit(getEventKey(payload.pin), payload);
}

export function subscribeToRealtime(
  pin: string,
  listener: (payload: RealtimePayload) => void
) {
  const eventKey = getEventKey(pin);
  const emitter = getRealtimeEmitter();
  emitter.on(eventKey, listener);

  return () => {
    emitter.off(eventKey, listener);
  };
}
