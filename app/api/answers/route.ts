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

type RejectedResult = {
  kind: "rejected";
  message: string;
  status: number;
};

type ExpiredResult = {
  kind: "expired";
  message: string;
  status: number;
  didClose: boolean;
  pin: string;
  event_id: string;
  question_id: string;
  current_question_index: number;
};

type SuccessResult = {
  kind: "success";
  pin: string;
  event_id: string;
  question_id: string;
  participant_id: string;
  is_correct: boolean;
  score_awarded: number;
  total_score: number;
};

type AnswerResult = RejectedResult | ExpiredResult | SuccessResult;

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
      async (tx): Promise<AnswerResult> => {
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
          return {
            kind: "rejected",
            message: "No encontramos al participante.",
            status: 404
          };
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
          return {
            kind: "rejected",
            message: "No encontramos esa pregunta.",
            status: 404
          };
        }

        if (participant.event_id !== question.event_id) {
          return {
            kind: "rejected",
            message: "El participante no pertenece a este evento.",
            status: 400
          };
        }

        const event = await tx.event.findUnique({
          where: {
            id: question.event_id
          },
          select: {
            id: true,
            pin: true,
            status: true,
            current_question_index: true,
            question_closes_at: true
          }
        });

        if (!event) {
          return {
            kind: "rejected",
            message: "No encontramos ese evento.",
            status: 404
          };
        }

        if (event.status === "finished") {
          return {
            kind: "rejected",
            message: "El evento ya finalizo.",
            status: 400
          };
        }

        if (event.status !== "question_live") {
          return {
            kind: "rejected",
            message: "No puedes responder en este momento.",
            status: 400
          };
        }

        if (question.order_index !== event.current_question_index) {
          return {
            kind: "rejected",
            message: "La pregunta ya no esta activa.",
            status: 400
          };
        }

        const now = new Date();
        const questionAlreadyClosed =
          !event.question_closes_at || event.question_closes_at <= now;

        if (questionAlreadyClosed) {
          const updated = await tx.event.updateMany({
            where: {
              id: event.id,
              status: "question_live",
              OR: [
                {
                  question_closes_at: null
                },
                {
                  question_closes_at: {
                    lte: now
                  }
                }
              ]
            },
            data: {
              status: "answer_reveal",
              question_started_at: null,
              question_closes_at: null
            }
          });

          return {
            kind: "expired",
            message: "Se acabo el tiempo para responder.",
            status: 400,
            didClose: updated.count > 0,
            pin: event.pin,
            event_id: event.id,
            question_id: question.id,
            current_question_index: event.current_question_index
          };
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
          return {
            kind: "rejected",
            message: "La opcion elegida no corresponde a esta pregunta.",
            status: 400
          };
        }

        const timeLimitMs = question.time_limit_seconds * 1000;

        if (payload.response_time_ms > timeLimitMs) {
          return {
            kind: "rejected",
            message: "Se acabo el tiempo para responder.",
            status: 400
          };
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
          kind: "success",
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

    if (result.kind === "rejected") {
      console.log("[answers] submit_rejected", {
        message: result.message,
        status: result.status
      });

      return NextResponse.json(
        {
          ok: false,
          message: result.message
        },
        { status: result.status }
      );
    }

    if (result.kind === "expired") {
      if (result.didClose) {
        emitRealtimeEvent({
          type: "answer:revealed",
          pin: result.pin,
          eventId: result.event_id,
          status: "answer_reveal",
          currentQuestionIndex: result.current_question_index,
          questionId: result.question_id,
          timestamp: Date.now()
        });
      }

      console.log("[answers] submit_expired", {
        question_id: result.question_id,
        event_id: result.event_id
      });

      return NextResponse.json(
        {
          ok: false,
          message: result.message
        },
        { status: result.status }
      );
    }

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

    return NextResponse.json(
      {
        ok: true,
        item: {
          is_correct: result.is_correct,
          score_awarded: result.score_awarded,
          total_score: result.total_score
        }
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
