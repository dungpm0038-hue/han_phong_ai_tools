"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  PenLine,
  FileText,
  Settings,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
const links = [
  { href: "/dashboard", name: "Tổng quan", icon: LayoutDashboard },
  { href: "/tools/chat", name: "AI Chat", icon: MessageSquare },
  { href: "/tools/writer", name: "AI Writer", icon: PenLine },
  { href: "/tools/pdf", name: "AI PDF", icon: FileText },
  { href: "/settings", name: "Cài đặt", icon: Settings },
];
export function WorkspaceShell({
  children,
  name,
  email,
}: {
  children: React.ReactNode;
  name: string;
  email: string;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      api<{ used: number }>("/api/usage")
        .then((d) => {
          if (active) setUsage(d.used);
        })
        .catch(() => {
          if (active) setUsage(null);
        });
    };
    refresh();
    window.addEventListener("usage-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("usage-changed", refresh);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>("a,button") || [],
      );
    controls()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab") {
        const items = controls(),
          first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="workspace">
      {open && (
        <button
          className="mobile-backdrop"
          aria-label="Đóng menu"
          tabIndex={-1}
          onClick={() => {
            setOpen(false);
            toggleRef.current?.focus();
          }}
        />
      )}
      <aside
        ref={sidebarRef}
        id="workspace-navigation"
        className={`sidebar ${open ? "open" : ""}`}
        aria-label="Menu không gian làm việc"
      >
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          className="mobile-close"
          aria-label="Đóng menu"
          onClick={() => {
            setOpen(false);
            toggleRef.current?.focus();
          }}
        >
          <X size={17} />
        </Button>
        <nav aria-label="Công cụ">
          <span className="nav-label">KHÔNG GIAN LÀM VIỆC</span>
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={path === link.href ? "active" : ""}
              aria-current={path === link.href ? "page" : undefined}
              onClick={() => {
                setOpen(false);
                toggleRef.current?.focus();
              }}
            >
              <link.icon size={17} />
              {link.name}
              {i === 0 && <span className="sr-only"> — Trang tổng quan</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="quota-card">
            <div className="quota-top">
              <span>Gói Free</span>
              <span>{usage === null ? "—" : usage} / 15 lượt</span>
            </div>
            <div
              className="quota-bar"
              role="progressbar"
              aria-label="Lượt AI đã dùng hôm nay"
              aria-valuenow={usage ?? undefined}
              aria-valuemin={0}
              aria-valuemax={15}
            >
              <span style={{ width: `${((usage ?? 0) / 15) * 100}%` }} />
            </div>
            <p>Đặt lại 07:00 giờ Việt Nam</p>
            <Link href="/pricing" className="text-link block mt-3">
              Khám phá các gói <ArrowUpRight size={11} className="inline" />
            </Link>
          </div>
          <Link
            className="account"
            href="/settings"
            onClick={() => setOpen(false)}
          >
            <span className="avatar">
              {(name || email).slice(0, 2).toUpperCase()}
            </span>
            <span className="truncate">
              {name || "Tài khoản của bạn"}
              <small className="truncate max-w-38">{email}</small>
            </span>
          </Link>
        </div>
      </aside>
      <div className="app-content">
        <header className="app-topbar">
          <div className="flex items-center gap-3">
            <Button
              ref={toggleRef}
              variant="ghost"
              size="icon"
              className="mobile-toggle"
              aria-label="Mở menu"
              aria-expanded={open}
              aria-controls="workspace-navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <span>
              Không gian làm việc <span className="mx-2 text-slate-700">/</span>{" "}
              <span className="text-slate-300">
                {links.find((l) => l.href === path)?.name || "Hàn Phong"}
              </span>
            </span>
          </div>
          <div className="topbar-right">
            <span className="muted">Sẵn sàng cho ý tưởng tiếp theo?</span>
            <span className="pill">
              <span className="dot" /> FREE
            </span>
          </div>
        </header>
        <main id="main" className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
