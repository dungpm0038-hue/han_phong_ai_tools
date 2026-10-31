import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/http";
export async function GET() {
  try {
    const { db, user } = await requireUser();
    const today = new Date().toISOString().slice(0, 10);
    const { count, error } = await db
      .from("usage_records")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .in("status", ["pending", "completed"]);
    if (error) throw error;
    return NextResponse.json({
      used: count || 0,
      limit: 15,
      resetTimezone: "UTC",
      plan: "free",
    });
  } catch (e) {
    return errorResponse(e);
  }
}
