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

async function getOwnedEvent(eventId: string, userId: string) {
  const event = await db.event.findFirst({
    where: {
      id: eventId,
      created_by: userId
    },
    select: {
      id: true,
      title: true,
      status: true
    }
  });

  return event;
}

export async function GET(_: Request, context: RouteContext) {
  const session = await getHostSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Debes iniciar sesion para ver estas preguntas."
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const event = await getOwnedEvent(id, session.sub);

  if (!event) {
    return NextResponse.json(
      {
        ok: false,
        message: "Event not found."
      },
      { status: 404 }
    );
  }

  const questions = await db.question.findMany({
    where: {
      event_id: id
    },
    orderBy: {
      order_index: "asc"
    },
    select: {
      id: true,
      statement: true,
      explanation: true,
      time_limit_seconds: true,
      order_index: true,
      created_at: true,
      updated_at: true,
      options: {
        select: {
          id: true,
          label: true,
          text: true,
          is_correct: true
        },
        orderBy: {
          label: "asc"
        }
      }
    }
  });

  return NextResponse.json({
    ok: true,
    items: questions
  });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getHostSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Debes iniciar sesion para crear preguntas."
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const event = await getOwnedEvent(id, session.sub);

    if (!event) {
      return NextResponse.json(
        {
          ok: false,
          message: "Event not found."
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const payload = createQuestionSchema.parse(body);

    const question = await db.$transaction(async (tx) => {
      const lastQuestion = await tx.question.findFirst({
        where: { event_id: id },
        orderBy: {
          order_index: "desc"
        },
        select: {
          order_index: true
        }
      });

      const orderIndex = (lastQuestion?.order_index ?? -1) + 1;

      return tx.question.create({
        data: {
          event_id: id,
          statement: payload.statement,
          explanation: payload.explanation,
          time_limit_seconds: payload.time_limit_seconds,
          order_index: orderIndex,
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

    return NextResponse.json(
      {
        ok: true,
        item: question
      },
      { status: 201 }
    );
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
        message: "Failed to create question."
      },
      { status: 500 }
    );
  }
}
