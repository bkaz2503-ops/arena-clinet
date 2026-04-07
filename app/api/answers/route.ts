import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { calculateAnswerScore } from "@/lib/scoring";
import { emitRealtimeEvent } from "@/lib/socket";
import {
  answerSchema,
  formatZodError,
  isZodValidationError
} from "@/lib/validations";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = answerSchema.parse(body);
    console.log("[answers] submit_attempt", {
      participant_id: payload.participant_id,
      question_id: payload.question_id,
      option_id: payload.option_id,
      response_time_ms: payload.response_time_ms
    });

    const result = await db.$transaction(
      async (tx) => {
        const participant = await tx.participant.findUnique({
          where: {
            id: payload.participant_id
          },
          select: {
            id: true,
            event_id: true
          }
        });

        if (!participant) {
          throw new ApiError("No encontramos al participante.", 404);
        }

        const question = await tx.question.findUnique({
          where: {
            id: payload.question_id
          },
          select: {
            id: true,
            event_id: true,
            order_index: true,
            time_limit_seconds: true
          }
        });

        if (!question) {
          throw new ApiError("No encontramos esa pregunta.", 404);
        }

        if (participant.event_id !== question.event_id) {
          throw new ApiError("El participante no pertenece a este evento.", 400);
        }

        const event = await tx.event.findUnique({
          where: {
            id: question.event_id
          },
          select: {
            id: true,
            pin: true,
            status: true,
            current_question_index: true
          }
        });

        if (!event) {
          throw new ApiError("No encontramos ese evento.", 404);
        }

        if (event.status === "finished") {
          throw new ApiError("El evento ya finalizo.", 400);
        }

        if (event.status !== "question_live") {
          throw new ApiError("No puedes responder en este momento.", 400);
        }

        if (question.order_index !== event.current_question_index) {
          throw new ApiError("La pregunta ya no esta activa.", 400);
        }

        const option = await tx.option.findUnique({
          where: {
            id: payload.option_id
          },
          select: {
            id: true,
            question_id: true,
            is_correct: true
          }
        });

        if (!option || option.question_id !== question.id) {
          throw new ApiError(
            "La opcion elegida no corresponde a esta pregunta.",
            400
          );
        }

        const timeLimitMs = question.time_limit_seconds * 1000;

        if (payload.response_time_ms > timeLimitMs) {
          throw new ApiError("Se acabo el tiempo para responder.", 400);
        }

        const safeResponseTimeMs = Math.max(
          0,
          Math.min(payload.response_time_ms, timeLimitMs)
        );

        const score = calculateAnswerScore({
          isCorrect: option.is_correct,
          responseTimeMs: safeResponseTimeMs,
          timeLimitSeconds: question.time_limit_seconds
        });

        await tx.answer.create({
          data: {
            participant_id: participant.id,
            question_id: question.id,
            option_id: option.id,
            is_correct: option.is_correct,
            response_time_ms: safeResponseTimeMs,
            score_awarded: score.total
          }
        });

        const updatedParticipant = await tx.participant.update({
          where: {
            id: participant.id
          },
          data: {
            total_score: {
              increment: score.total
            }
          },
          select: {
            total_score: true
          }
        });

        return {
          pin: event.pin,
          event_id: event.id,
          question_id: question.id,
          participant_id: participant.id,
          is_correct: option.is_correct,
          score_awarded: score.total,
          total_score: updatedParticipant.total_score
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    console.log("[answers] submit_success", {
      participant_id: payload.participant_id,
      question_id: payload.question_id,
      score_awarded: result.score_awarded,
      total_score: result.total_score
    });

    emitRealtimeEvent({
      type: "leaderboard:updated",
      pin: result.pin,
      eventId: result.event_id,
      currentQuestionIndex: undefined,
      questionId: result.question_id,
      participantId: result.participant_id,
      timestamp: Date.now()
    });

    const responseItem = {
      is_correct: result.is_correct,
      score_awarded: result.score_awarded,
      total_score: result.total_score
    };

    return NextResponse.json(
      {
        ok: true,
        item: responseItem
      },
      { status: 201 }
    );
  } catch (error) {
    if (isZodValidationError(error)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Datos de respuesta invalidos.",
          issues: formatZodError(error)
        },
        { status: 400 }
      );
    }

    if (error instanceof ApiError) {
      console.log("[answers] submit_rejected", {
        message: error.message,
        status: error.status
      });

      return NextResponse.json(
        {
          ok: false,
          message: error.message
        },
        { status: error.status }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.log("[answers] submit_duplicate", {
        code: error.code
      });

      return NextResponse.json(
        {
          ok: false,
          message: "Ya respondiste esta pregunta."
        },
        { status: 409 }
      );
    }

    console.log("[answers] submit_error", {
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos registrar la respuesta."
      },
      { status: 500 }
    );
  }
}
