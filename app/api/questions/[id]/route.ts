import { NextResponse } from "next/server";

import { getHostSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createQuestionSchema,
  formatZodError,
  isZodValidationError
} from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getQuestionWithEvent(questionId: string) {
  return db.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      event_id: true,
      order_index: true,
      event: {
        select: {
          id: true,
          created_by: true,
          status: true,
          current_question_index: true
        }
      }
    }
  });
}

function canManageQuestion(status: string) {
  return status === "draft" || status === "lobby";
}

function getQuestionManagementError(status: string) {
  return `Solo puedes editar o eliminar preguntas cuando el evento esta en configuracion o esperando participantes. Estado actual: ${status}.`;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getHostSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Debes iniciar sesion para editar preguntas."
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const question = await getQuestionWithEvent(id);

    if (!question) {
      return NextResponse.json(
        {
          ok: false,
          message: "Question not found."
        },
        { status: 404 }
      );
    }

    if (question.event.created_by !== session.sub) {
      return NextResponse.json(
        {
          ok: false,
          message: "No puedes modificar preguntas de otro expositor."
        },
        { status: 403 }
      );
    }

    if (!canManageQuestion(question.event.status)) {
      return NextResponse.json(
        {
          ok: false,
          message: getQuestionManagementError(question.event.status)
        },
        { status: 400 }
      );
    }

    if (question.order_index < question.event.current_question_index) {
      return NextResponse.json(
        {
          ok: false,
          message: "No puedes modificar una pregunta que ya fue usada en este evento."
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const payload = createQuestionSchema.parse(body);

    const updatedQuestion = await db.$transaction(async (tx) => {
      await tx.option.deleteMany({
        where: {
          question_id: id
        }
      });

      return tx.question.update({
        where: {
          id
        },
        data: {
          statement: payload.statement,
          explanation: payload.explanation,
          time_limit_seconds: payload.time_limit_seconds,
          options: {
            create: payload.options.map((option) => ({
              label: option.label,
              text: option.text,
              is_correct: option.is_correct
            }))
          }
        },
        select: {
          id: true,
          order_index: true
        }
      });
    });

    return NextResponse.json({
      ok: true,
      item: updatedQuestion
    });
  } catch (error) {
    if (isZodValidationError(error)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid question payload.",
          issues: formatZodError(error)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to update question."
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getHostSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Debes iniciar sesion para eliminar preguntas."
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const question = await getQuestionWithEvent(id);

    if (!question) {
      return NextResponse.json(
        {
          ok: false,
          message: "Question not found."
        },
        { status: 404 }
      );
    }

    if (question.event.created_by !== session.sub) {
      return NextResponse.json(
        {
          ok: false,
          message: "No puedes eliminar preguntas de otro expositor."
        },
        { status: 403 }
      );
    }

    if (!canManageQuestion(question.event.status)) {
      return NextResponse.json(
        {
          ok: false,
          message: getQuestionManagementError(question.event.status)
        },
        { status: 400 }
      );
    }

    if (question.order_index < question.event.current_question_index) {
      return NextResponse.json(
        {
          ok: false,
          message: "No puedes eliminar una pregunta que ya fue usada en este evento."
        },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.question.delete({
        where: {
          id
        }
      });

      await tx.question.updateMany({
        where: {
          event_id: question.event_id,
          order_index: {
            gt: question.order_index
          }
        },
        data: {
          order_index: {
            decrement: 1
          }
        }
      });

      if (question.event.current_question_index > question.order_index) {
        await tx.event.update({
          where: {
            id: question.event_id
          },
          data: {
            current_question_index: {
              decrement: 1
            }
          }
        });
      }
    });

    return NextResponse.json({
      ok: true,
      item: {
        id
      }
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to delete question."
      },
      { status: 500 }
    );
  }
}
