import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { emitRealtimeEvent } from "@/lib/socket";
import { getEventTransitionError } from "@/lib/state-machine";

type RouteContext = {
  params: Promise<{ id: string; questionId: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id, questionId } = await context.params;
  console.log("[event.reveal] attempt", { event_id: id, question_id: questionId });

  const event = await db.event.findUnique({
    where: { id },
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
        message: "No encontramos ese evento."
      },
      { status: 404 }
    );
  }

  const question = await db.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      event_id: true,
      order_index: true
    }
  });

  if (!question || question.event_id !== event.id) {
    return NextResponse.json(
      {
        ok: false,
        message: "No encontramos esa pregunta en este evento."
      },
      { status: 404 }
    );
  }

  if (question.order_index !== event.current_question_index) {
    return NextResponse.json(
      {
        ok: false,
        message: "La pregunta ya no esta activa."
      },
      { status: 400 }
    );
  }

  const transitionError = getEventTransitionError(event.status, "answer_reveal");

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
      status: "answer_reveal"
    },
    select: {
      id: true,
      pin: true,
      status: true,
      current_question_index: true
    }
  });

  console.log("[event.reveal] success", {
    event_id: event.id,
    question_id: question.id,
    current_question_index: updatedEvent.current_question_index,
    status: updatedEvent.status
  });

  emitRealtimeEvent({
    type: "answer:revealed",
    pin: updatedEvent.pin,
    eventId: updatedEvent.id,
    status: updatedEvent.status,
    currentQuestionIndex: updatedEvent.current_question_index,
    questionId: question.id,
    timestamp: Date.now()
  });

  return NextResponse.json({
    ok: true,
    item: {
      ...updatedEvent,
      question_id: question.id
    }
  });
}
