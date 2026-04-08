import { NextResponse } from "next/server";

import { getHostSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePin } from "@/lib/pin";
import {
  createEventSchema,
  formatZodError,
  isZodValidationError
} from "@/lib/validations";

async function generateUniqueEventPin() {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const pin = generatePin();
    const existingEvent = await db.event.findFirst({
      where: { pin },
      select: { id: true }
    });

    if (!existingEvent) {
      return pin;
    }
  }

  throw new Error("Unable to generate a unique event PIN.");
}

export async function GET() {
  const session = await getHostSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Debes iniciar sesion para ver tus eventos."
      },
      { status: 401 }
    );
  }

  const events = await db.event.findMany({
    where: {
      created_by: session.sub
    },
    orderBy: {
      created_at: "desc"
    },
    select: {
      id: true,
      title: true,
      specialty: true,
      pin: true,
      status: true,
      current_question_index: true,
      created_at: true,
      updated_at: true
    }
  });

  return NextResponse.json({
    ok: true,
    items: events
  });
}

export async function POST(request: Request) {
  const session = await getHostSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Debes iniciar sesion para crear eventos."
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const payload = createEventSchema.parse(body);
    const pin = await generateUniqueEventPin();

    const event = await db.event.create({
      data: {
        title: payload.title,
        specialty: payload.specialty,
        pin,
        status: "draft",
        created_by: session.sub
      },
      select: {
        id: true,
        pin: true
      }
    });

    return NextResponse.json(
      {
        ok: true,
        item: event
      },
      { status: 201 }
    );
  } catch (error) {
    if (isZodValidationError(error)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Revisa el titulo y la especialidad del evento.",
          issues: formatZodError(error)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos crear el evento."
      },
      { status: 500 }
    );
  }
}
