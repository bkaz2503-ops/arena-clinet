import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "Login placeholder pending implementation."
    },
    { status: 501 }
  );
}
