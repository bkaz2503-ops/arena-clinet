import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { assignAvatarId } from "@/lib/avatars";
import { db } from "@/lib/db";
import { emitRealtimeEvent } from "@/lib/socket";
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

    const existingParticipants = await db.participant.findMany({
      where: {
        event_id: event.id
      },
      select: {
        avatar_id: true
      }
    });

    const avatarId = assignAvatarId(
      existingParticipants.map((participant) => participant.avatar_id)
    );

    const participant = await db.participant.create({
      data: {
        event_id: event.id,
        display_name: payload.display_name,
        avatar_id: avatarId
      },
      select: {
        id: true,
        display_name: true,
        avatar_id: true,
        total_score: true,
        joined_at: true
      }
    });

    emitRealtimeEvent({
      type: "participant:joined",
      pin: event.pin,
      eventId: event.id,
      participantId: participant.id,
      timestamp: Date.now()
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
