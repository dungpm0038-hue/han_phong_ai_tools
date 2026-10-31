import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, sameOrigin, jsonBody, errorResponse } from "@/lib/http";
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const { db, user } = await requireUser();
    const body = z
      .object({ display_name: z.string().trim().min(1).max(80) })
      .parse(await jsonBody(request));
    const { error } = await db.from("profiles").update(body).eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const { db } = await requireUser();
    const { error } = await db.auth.signOut();
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
