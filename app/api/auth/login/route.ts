import { NextResponse } from "next/server";

import {
  buildHostSessionPayload,
  ensurePlaceholderHost,
  signAuthToken,
  setHostSessionCookie,
  verifyPassword
} from "@/lib/auth";
import { db } from "@/lib/db";
import { isZodValidationError, loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = loginSchema.parse(body);

    if (payload.email === "host@arena-clinet.local") {
      await ensurePlaceholderHost();
    }

    const user = await db.user.findUnique({
      where: {
        email: payload.email
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password_hash: true
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Email o contrasena incorrectos."
        },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(
      payload.password,
      user.password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        {
          ok: false,
          message: "Email o contrasena incorrectos."
        },
        { status: 401 }
      );
    }

    const token = signAuthToken(buildHostSessionPayload(user));

    const response = NextResponse.json({
      ok: true,
      item: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      redirectTo: "/host/dashboard"
    });

    setHostSessionCookie(response, token);

    return response;
  } catch (error) {
    if (isZodValidationError(error)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Completa email y contrasena correctamente."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos iniciar sesion."
      },
      { status: 500 }
    );
  }
}
