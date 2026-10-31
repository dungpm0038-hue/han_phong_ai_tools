import Link from "next/link";
import { ArrowUpRight, MessageSquare, Sparkles } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { ToolCards } from "@/components/marketing";
import { Button } from "@/components/ui/button";
export const metadata = { title: "Tổng quan" };
export default async function Dashboard() {
  const { db, user } = await requirePageUser();
  const [profile, usage, conversations, documents] = await Promise.all([
    db.from("profiles").select("display_name").eq("id", user.id).single(),
    db
      .from("usage_records")
      .select("id", { count: "exact", head: true })
      .eq("usage_date", new Date().toISOString().slice(0, 10))
      .in("status", ["pending", "completed"]),
    db
      .from("conversations")
      .select("id,title,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5),
    db.from("documents").select("id", { count: "exact", head: true }),
  ]);
  if ([profile, usage, conversations, documents].some((r) => r.error))
    throw new Error(
      "Không thể tải dashboard. Kiểm tra migration và kết nối Supabase.",
    );
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">MỖI Ý TƯỞNG ĐỀU CÓ MỘT KHỞI ĐẦU</span>
          <h1>
            Chào {profile.data?.display_name || "bạn"}{" "}
            <span className="gradient-text">✳</span>
          </h1>
          <p>Hôm nay, bạn muốn tạo ra điều gì?</p>
        </div>
        <span className="pill">Không gian cá nhân</span>
      </div>
      <section className="dashboard-welcome">
        <div>
          <span className="eyebrow">TỪ Ý TƯỞNG ĐẾN HÀNH ĐỘNG</span>
          <h2>
            Một chút trợ giúp.
            <br />
            Một bước tiến xa hơn.
          </h2>
          <p>
            Để AI giúp bạn với những bước đầu tiên. Phần sáng tạo nhất vẫn luôn
            thuộc về bạn.
          </p>
          <Button asChild size="sm">
            <Link href="/tools/chat">
              Bắt đầu trò chuyện <ArrowUpRight size={14} />
            </Link>
          </Button>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <Sparkles size={46} strokeWidth={1} />
        </div>
      </section>
      <div className="stats-grid">
        <div className="stat-card">
          <label>LƯỢT AI HÔM NAY</label>
          <strong>
            {usage.count || 0}
            <span className="text-base text-slate-600"> / 15</span>
          </strong>
          <small>Đặt lại 07:00</small>
        </div>
        <div className="stat-card">
          <label>CUỘC TRÒ CHUYỆN</label>
          <strong>{conversations.count || 0}</strong>
          <small>Đã lưu</small>
        </div>
        <div className="stat-card">
          <label>TÀI LIỆU PDF</label>
          <strong>{documents.count || 0}</strong>
          <small>Trong thư viện</small>
        </div>
      </div>
      <div className="section-caption">
        <h2>Chọn công cụ, bắt đầu ngay</h2>
        <span>03 CÔNG CỤ</span>
      </div>
      <ToolCards dashboard />
      <section className="activity">
        <div className="activity-head">Cuộc trò chuyện gần đây</div>
        {conversations.data?.length ? (
          conversations.data.map((c) => (
            <Link
              href={`/tools/chat?conversation=${c.id}`}
              className="activity-row"
              key={c.id}
            >
              <MessageSquare size={16} />
              <span className="truncate">{c.title}</span>
              <time dateTime={c.created_at}>
                {new Date(c.created_at).toLocaleDateString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })}
              </time>
              <ArrowUpRight size={13} />
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <p>
              Chưa có cuộc trò chuyện nào. Bắt đầu từ câu hỏi đầu tiên của bạn.
            </p>
            <Link className="text-link" href="/tools/chat">
              Mở AI Chat →
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
