import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { readLimitedBody } from "@/lib/limits.mjs";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireUser() {
  const db = await supabaseServer();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user)
    throw new HttpError(401, "Vui lòng đăng nhập để tiếp tục.");
  return { db, user };
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url)
    .origin;
  if (!origin || origin !== expected)
    throw new HttpError(403, "Nguồn yêu cầu không hợp lệ.");
}
export async function jsonBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Yêu cầu JSON.");
  return JSON.parse(new TextDecoder().decode(await readLimitedBody(request)));
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof RangeError)
    return NextResponse.json(
      { error: "Yêu cầu vượt quá kích thước cho phép." },
      { status: 413 },
    );
  if (error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Nội dung yêu cầu không hợp lệ." },
      { status: 400 },
    );
  if (error instanceof Error && error.name === "ZodError")
    return NextResponse.json(
      {
        error: "Dữ liệu không hợp lệ. Kiểm tra độ dài và các trường bắt buộc.",
      },
      { status: 400 },
    );
  return NextResponse.json(
    { error: "Dịch vụ chưa sẵn sàng hoặc gặp lỗi. Vui lòng thử lại sau." },
    { status: 503 },
  );
}
