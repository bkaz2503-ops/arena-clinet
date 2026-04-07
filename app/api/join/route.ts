import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  formatZodError,
  isZodValidationError,
  joinEventSchema
} from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = joinEventSchema.parse(body);

    const event = await db.event.findFirst({
      where: {
        pin: payload.pin
      },
      select: {
        id: true,
        title: true,
        pin: true,
        status: true
      }
    });

    if (!event) {
      return NextResponse.json(
        {
          ok: false,
          message: "Event not found for the provided PIN."
        },
        { status: 404 }
      );
    }

    if (event.status === "finished") {
      return NextResponse.json(
        {
          ok: false,
          message: "This event is already finished."
        },
        { status: 400 }
      );
    }

    const participant = await db.participant.create({
      data: {
        event_id: event.id,
        display_name: payload.display_name
      },
      select: {
        id: true,
        display_name: true,
        total_score: true,
        joined_at: true
      }
    });

    return NextResponse.json(
      {
        ok: true,
        item: {
          participant,
          event
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (isZodValidationError(error)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid join payload.",
          issues: formatZodError(error)
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Display name already exists for this event."
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to join event."
      },
      { status: 500 }
    );
  }
}
