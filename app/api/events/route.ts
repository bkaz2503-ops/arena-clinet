import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePin } from "@/lib/pin";
import { createEventSchema } from "@/lib/validations";

const PLACEHOLDER_HOST = {
  email: "host@arena-clinet.local",
  name: "Host Placeholder",
  password: "arena-clinet-host"
};

async function ensurePlaceholderHost() {
  const passwordHash = await hashPassword(PLACEHOLDER_HOST.password);

  return db.user.upsert({
    where: {
      email: PLACEHOLDER_HOST.email
    },
    update: {},
    create: {
      email: PLACEHOLDER_HOST.email,
      name: PLACEHOLDER_HOST.name,
      password_hash: passwordHash,
      role: "host"
    }
  });
}

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
  const events = await db.event.findMany({
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
  try {
    const body = await request.json();
    const payload = createEventSchema.parse(body);
    const host = await ensurePlaceholderHost();
    const pin = await generateUniqueEventPin();

    const event = await db.event.create({
      data: {
        title: payload.title,
        specialty: payload.specialty,
        pin,
        status: "draft",
        created_by: host.id
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
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid event payload."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to create event."
      },
      { status: 500 }
    );
  }
}
