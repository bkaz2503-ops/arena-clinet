import { db } from "@/lib/db";
import { emitRealtimeEvent } from "@/lib/socket";

type TimeoutHandle = ReturnType<typeof setTimeout>;

const globalForQuestionTimer = globalThis as typeof globalThis & {
  arenaQuestionTimers?: Map<string, TimeoutHandle>;
};

function getTimerStore() {
  if (!globalForQuestionTimer.arenaQuestionTimers) {
    globalForQuestionTimer.arenaQuestionTimers = new Map();
  }

  return globalForQuestionTimer.arenaQuestionTimers;
}

export function clearQuestionAutoClose(eventId: string) {
  const timerStore = getTimerStore();
  const existingTimer = timerStore.get(eventId);

  if (existingTimer) {
    clearTimeout(existingTimer);
    timerStore.delete(eventId);
  }
}

export async function closeQuestionIfExpired(eventId: string) {
  const now = new Date();
  console.log("[question.auto_close] check", {
    event_id: eventId,
    now: now.toISOString()
  });
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      pin: true,
      status: true,
      current_question_index: true,
      question_closes_at: true
    }
  });

  if (
    !event ||
    event.status !== "question_live" ||
    !event.question_closes_at ||
    event.question_closes_at > now
  ) {
    return null;
  }

  const activeQuestion = await db.question.findFirst({
    where: {
      event_id: event.id,
      order_index: event.current_question_index
    },
    select: {
      id: true
    }
  });

  const updatedEvent = await db.event.updateMany({
    where: {
      id: event.id,
      status: "question_live",
      question_closes_at: {
        lte: now
      }
    },
    data: {
      status: "answer_reveal",
      question_started_at: null,
      question_closes_at: null
    }
  });

  if (updatedEvent.count === 0) {
    return null;
  }

  clearQuestionAutoClose(event.id);
  console.log("[question.auto_close] success", {
    event_id: event.id,
    question_id: activeQuestion?.id,
    status: "answer_reveal"
  });

  emitRealtimeEvent({
    type: "answer:revealed",
    pin: event.pin,
    eventId: event.id,
    status: "answer_reveal",
    currentQuestionIndex: event.current_question_index,
    questionId: activeQuestion?.id,
    timestamp: now.getTime()
  });

  return {
    id: event.id,
    pin: event.pin,
    status: "answer_reveal" as const,
    current_question_index: event.current_question_index,
    question_id: activeQuestion?.id ?? null
  };
}

export function scheduleQuestionAutoClose(params: {
  eventId: string;
  closesAt: Date;
}) {
  clearQuestionAutoClose(params.eventId);

  const delayMs = Math.max(params.closesAt.getTime() - Date.now(), 0);
  const timer = setTimeout(() => {
    void closeQuestionIfExpired(params.eventId);
  }, delayMs);

  getTimerStore().set(params.eventId, timer);
}
