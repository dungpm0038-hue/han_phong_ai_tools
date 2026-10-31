import { NextResponse } from "next/server";
import { z } from "zod";
import {
  requireUser,
  sameOrigin,
  jsonBody,
  errorResponse,
  HttpError,
} from "@/lib/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    const id = z.uuid().parse((await params).id);
    const { db } = await requireUser();
    const { data: conversation } = await db
      .from("conversations")
      .select("id")
      .eq("id", id)
      .single();
    if (!conversation)
      throw new HttpError(404, "Không tìm thấy cuộc trò chuyện.");
    const { data, error } = await db
      .from("messages")
      .select("id,role,content,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json(data?.reverse());
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    sameOrigin(request);
    const id = z.uuid().parse((await params).id);
    const body = z
      .object({ title: z.string().trim().min(1).max(100) })
      .parse(await jsonBody(request));
    const { db } = await requireUser();
    const { data, error } = await db
      .from("conversations")
      .update(body)
      .eq("id", id)
      .select("id")
      .single();
    if (error || !data)
      throw new HttpError(404, "Không tìm thấy cuộc trò chuyện.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    sameOrigin(request);
    const id = z.uuid().parse((await params).id);
    const { db } = await requireUser();
    const { data, error } = await db
      .from("conversations")
      .delete()
      .eq("id", id)
      .select("id")
      .single();
    if (error || !data)
      throw new HttpError(404, "Không tìm thấy cuộc trò chuyện.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
