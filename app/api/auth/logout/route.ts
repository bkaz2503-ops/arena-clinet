import { NextResponse } from "next/server";

import { HOST_SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    message: "Sesion cerrada."
  });

  response.cookies.set(HOST_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  return response;
}
