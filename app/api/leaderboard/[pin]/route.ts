import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { normalizePin } from "@/lib/pin";
import { closeQuestionIfExpired } from "@/lib/question-timer";

type RouteContext = {
  params: Promise<{ pin: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { pin } = await context.params;
  const normalizedPin = normalizePin(pin);

  let event = await db.event.findFirst({
    where: {
      pin: normalizedPin
    },
    select: {
      id: true,
      title: true,
      pin: true,
      status: true,
      current_question_index: true
    }
  });

  if (!event) {
    return NextResponse.json(
      {
        ok: false,
        message: "No encontramos un evento para ese PIN."
      },
      { status: 404 }
    );
  }

  const autoClosedEvent = await closeQuestionIfExpired(event.id);

  if (autoClosedEvent) {
    event = {
      ...event,
      status: autoClosedEvent.status,
      current_question_index: autoClosedEvent.current_question_index
    };
  }

  const participants = await db.participant.findMany({
    where: {
      event_id: event.id
    },
    orderBy: [{ total_score: "desc" }, { joined_at: "asc" }],
    select: {
      id: true,
      display_name: true,
      avatar_id: true,
      total_score: true,
      joined_at: true
    }
  });

  const canShowCurrentQuestion =
    event.status === "question_live" ||
    event.status === "answer_reveal" ||
    event.status === "leaderboard" ||
    event.status === "finished";

  const currentQuestion = canShowCurrentQuestion
    ? await db.question.findFirst({
        where: {
          event_id: event.id,
          order_index: event.current_question_index
        },
        select: {
          id: true,
          statement: true,
          explanation: true,
          time_limit_seconds: true,
          order_index: true,
          options: {
            orderBy: {
              label: "asc"
            },
            select: {
              id: true,
              label: true,
              text: true,
              is_correct: true
            }
          }
        }
      })
    : null;

  const shouldRevealCorrectness =
    event.status === "answer_reveal" ||
    event.status === "leaderboard" ||
    event.status === "finished";

  const publicCurrentQuestion = currentQuestion
    ? {
        ...currentQuestion,
        options: currentQuestion.options.map((option) => ({
          id: option.id,
          label: option.label,
          text: option.text,
          ...(shouldRevealCorrectness ? { is_correct: option.is_correct } : {})
        }))
      }
    : null;

  return NextResponse.json({
    ok: true,
    item: {
      event,
      leaderboard: participants.slice(0, 10),
      participants,
      current_question: publicCurrentQuestion
    }
  });
}
