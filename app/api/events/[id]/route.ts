import { NextResponse } from "next/server";

import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const event = await db.event.findUnique({
    where: { id },
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
  const { id } = await context.params;

  return NextResponse.json(
    {
      ok: false,
      item: { id },
      message: "Update event placeholder pending implementation."
    },
    { status: 501 }
  );
}
