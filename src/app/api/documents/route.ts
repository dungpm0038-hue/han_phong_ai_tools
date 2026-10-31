import { NextResponse } from "next/server";
import { z } from "zod";
import {
  requireUser,
  sameOrigin,
  jsonBody,
  errorResponse,
  HttpError,
} from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  MAX_PDF_BYTES,
  hasPdfSignature,
  readLimitedBody,
} from "@/lib/limits.mjs";
import { extractPdf } from "@/lib/pdf";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function GET() {
  try {
    const { db } = await requireUser();
    const { data, error } = await db
      .from("documents")
      .select("id,name,total_pages,processed_pages,truncated,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireUser();
    if (
      request.headers.get("content-type")?.split(";")[0] !== "application/pdf"
    )
      throw new HttpError(415, "Chỉ chấp nhận MIME application/pdf.");
    // Vercel function ingress is 4.5 MB; UI uses 4 MB, parser hard limit remains 5 MB.
    const bytes = await readLimitedBody(
      request,
      Math.min(MAX_PDF_BYTES, 4 * 1024 * 1024),
    );
    if (!hasPdfSignature(bytes))
      throw new HttpError(422, "Nội dung tệp không phải PDF.");
    let name: string;
    try {
      name = decodeURIComponent(
        request.headers.get("x-file-name") || "document.pdf",
      );
    } catch {
      throw new HttpError(400, "Tên tệp không hợp lệ.");
    }
    name = z
      .string()
      .trim()
      .min(1)
      .max(160)
      .parse(name)
      .replace(/[\x00-\x1f/\\]/g, "_");
    const admin = supabaseAdmin();
    const { data: allowed, error: limitError } = await admin.rpc(
      "reserve_pdf_upload",
      { p_user: user.id },
    );
    if (limitError) throw limitError;
    if (!allowed)
      throw new HttpError(
        429,
        "Giới hạn 20 lần tải PDF/ngày, 3 lần/phút và tối đa 20 tài liệu lưu trữ.",
      );
    const parsed = await extractPdf(bytes);
    const { data, error } = await admin.rpc("save_pdf_document", {
      p_user: user.id,
      p_name: name,
      p_text: parsed.text,
      p_total: parsed.totalPages,
      p_processed: parsed.processedPages,
      p_truncated: parsed.truncated,
    });
    if (error) throw error;
    if (!data)
      throw new HttpError(
        429,
        "Thư viện đã đầy. Xóa bớt tài liệu để tiếp tục.",
      );
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const { db } = await requireUser();
    const { id } = z.object({ id: z.uuid() }).parse(await jsonBody(request));
    const { data, error } = await db
      .from("documents")
      .delete()
      .eq("id", id)
      .select("id")
      .single();
    if (error || !data) throw new HttpError(404, "Không tìm thấy tài liệu.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
