"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
export function SettingsForm({ name, email }: { name: string; email: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ display_name: form.get("name") }),
      });
      toast.success("Đã cập nhật tên của bạn.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể lưu.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await api("/api/account", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể đăng xuất.");
      setBusy(false);
    }
  }
  return (
    <div className="settings-grid">
      <form onSubmit={save} className="panel form-stack">
        <h2>Hồ sơ cá nhân</h2>
        <p className="text-xs">Một chút cá nhân hóa cho không gian của bạn.</p>
        <div>
          <label htmlFor="name">Tên hiển thị</label>
          <input
            id="name"
            name="name"
            defaultValue={name}
            minLength={1}
            maxLength={80}
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="account-email">Email tài khoản</label>
          <input id="account-email" value={email} type="email" readOnly />
          <p className="field-help">Email đã đăng ký với Supabase Auth.</p>
        </div>
        <Button type="submit" disabled={busy} className="justify-self-start">
          <Save size={14} /> Lưu thay đổi
        </Button>
      </form>
      <div className="stack">
        <section className="panel">
          <span className="pill">Gói hiện tại</span>
          <h2 className="text-2xl mt-4">Free</h2>
          <p className="text-xs">
            15 lượt AI mỗi ngày. Đặt lại lúc 07:00 giờ Việt Nam.
          </p>
          <p className="text-xs flex items-center gap-2">
            <Check size={14} className="text-violet-300" /> Chat, Writer và PDF
          </p>
          <Link href="/pricing" className="text-link">
            Xem thông tin các gói →
          </Link>
        </section>
        <section className="panel">
          <h2 className="text-base">Phiên đăng nhập</h2>
          <p className="text-xs">Đăng xuất tài khoản khỏi phiên hiện tại.</p>
          <Button variant="outline" disabled={busy} onClick={logout}>
            <LogOut size={14} /> Đăng xuất
          </Button>
        </section>
      </div>
    </div>
  );
}
