import { NextResponse } from "next/server";
import { requireUser, sameOrigin, jsonBody, errorResponse } from "@/lib/http";
import { z } from "zod";
export async function GET() {
  try {
    const { db } = await requireUser();
    const { data, error } = await db
      .from("conversations")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db, user } = await requireUser();
    const body = z
      .object({
        title: z.string().trim().min(1).max(100).default("Cuộc trò chuyện mới"),
      })
      .parse(await jsonBody(request));
    const { data, error } = await db
      .from("conversations")
      .insert({ ...body, user_id: user.id })
      .select("id,title,created_at")
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
