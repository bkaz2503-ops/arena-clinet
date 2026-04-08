import { NextResponse } from "next/server";

import { getHostSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { clearQuestionAutoClose } from "@/lib/question-timer";
import { emitRealtimeEvent } from "@/lib/socket";
import { getEventTransitionError } from "@/lib/state-machine";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const session = await getHostSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Debes iniciar sesion para iniciar este evento."
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  const event = await db.event.findFirst({
    where: {
      id,
      created_by: session.sub
    },
    select: {
      id: true,
      pin: true,
      status: true,
      current_question_index: true
    }
  });

  if (!event) {
    return NextResponse.json(
      {
        ok: false,
        message: "Event not found."
      },
      { status: 404 }
    );
  }

  const transitionError = getEventTransitionError(event.status, "lobby");

  if (transitionError) {
    return NextResponse.json(
      {
        ok: false,
        message: transitionError
      },
      { status: 400 }
    );
  }

  const updatedEvent = await db.event.update({
    where: { id: event.id },
    data: {
      status: "lobby",
      question_started_at: null,
      question_closes_at: null
    },
    select: {
      id: true,
      pin: true,
      status: true,
      current_question_index: true
    }
  });

  clearQuestionAutoClose(updatedEvent.id);

  emitRealtimeEvent({
    type: "event:lobby",
    pin: updatedEvent.pin,
    eventId: updatedEvent.id,
    status: updatedEvent.status,
    currentQuestionIndex: updatedEvent.current_question_index,
    timestamp: Date.now()
  });

  return NextResponse.json({
    ok: true,
    item: updatedEvent
  });
}
