import { NextResponse } from "next/server";

import {
  buildHostSessionPayload,
  hashPassword,
  signAuthToken,
  setHostSessionCookie
} from "@/lib/auth";
import { db } from "@/lib/db";
import {
  formatZodError,
  isZodValidationError,
  registerHostSchema
} from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = registerHostSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: {
        email: payload.email
      },
      select: {
        id: true
      }
    });

    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
          message: "Ya existe una cuenta con ese correo."
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(payload.password);

    const user = await db.user.create({
      data: {
        name: payload.name,
        profession: payload.profession,
        institution: payload.institution,
        country: payload.country,
        whatsapp: payload.whatsapp,
        email: payload.email,
        password_hash: passwordHash,
        role: "host"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    const token = signAuthToken(buildHostSessionPayload(user));
    const response = NextResponse.json(
      {
        ok: true,
        item: user,
        redirectTo: "/host/dashboard"
      },
      { status: 201 }
    );

    setHostSessionCookie(response, token);

    return response;
  } catch (error) {
    if (isZodValidationError(error)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Revisa los datos del registro.",
          issues: formatZodError(error)
        },
        { status: 400 }
      );
    }

    console.error("[auth.register] failed", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos crear tu cuenta."
      },
      { status: 500 }
    );
  }
}
