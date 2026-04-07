import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_: Request, context: RouteContext) {
  const { id } = await context.params;

  return NextResponse.json(
    {
      ok: false,
      item: { id },
      message: "Update question placeholder pending implementation."
    },
    { status: 501 }
  );
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;

  return NextResponse.json(
    {
      ok: false,
      item: { id },
      message: "Delete question placeholder pending implementation."
    },
    { status: 501 }
  );
}
