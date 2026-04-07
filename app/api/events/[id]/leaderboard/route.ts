import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { emitRealtimeEvent } from "@/lib/socket";
import { EventStatus, getEventTransitionError } from "@/lib/state-machine";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function transitionEventStatus(eventId: string, nextStatus: EventStatus) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      pin: true,
      status: true,
      current_question_index: true
    }
  });

  if (!event) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          message: "Event not found."
        },
        { status: 404 }
      )
    };
  }

  const transitionError = getEventTransitionError(event.status, nextStatus);

  if (transitionError) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          message: transitionError
        },
        { status: 400 }
      )
    };
  }

  const updatedEvent = await db.event.update({
    where: { id: event.id },
    data: {
      status: nextStatus
    },
    select: {
      id: true,
      pin: true,
      status: true,
      current_question_index: true
    }
  });

  return { event: updatedEvent };
}

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await transitionEventStatus(id, "leaderboard");

  if (result.error) {
    return result.error;
  }

  if (result.event) {
    emitRealtimeEvent({
      type: "leaderboard:updated",
      pin: result.event.pin,
      eventId: result.event.id,
      status: result.event.status,
      currentQuestionIndex: result.event.current_question_index,
      timestamp: Date.now()
    });
  }

  return NextResponse.json({
    ok: true,
    item: result.event
  });
}
