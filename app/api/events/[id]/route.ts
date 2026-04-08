import { NextResponse } from "next/server";

import { getHostSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { closeQuestionIfExpired } from "@/lib/question-timer";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const session = await getHostSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Debes iniciar sesion para ver este evento."
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  await closeQuestionIfExpired(id);

  const event = await db.event.findFirst({
    where: {
      id,
      created_by: session.sub
    },
    select: {
      id: true,
      title: true,
      specialty: true,
      pin: true,
      status: true,
      created_by: true,
      current_question_index: true,
      created_at: true,
      updated_at: true
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

  return NextResponse.json({
    ok: true,
    item: event
  });
}

export async function PATCH(_: Request, context: RouteContext) {
  const session = await getHostSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Debes iniciar sesion para actualizar este evento."
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
      id: true
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

  return NextResponse.json(
    {
      ok: false,
      item: { id: event.id },
      message: "Update event placeholder pending implementation."
    },
    { status: 501 }
  );
}
