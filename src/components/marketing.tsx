import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  MessageSquare,
  PenLine,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
export const tools = [
  {
    name: "AI Chat",
    label: "Một ý tưởng. Vô vàn khả năng.",
    description:
      "Gỡ rối bài tập, khám phá ý tưởng và tìm hướng giải quyết. Một người bạn đồng hành cho những câu hỏi mỗi ngày.",
    href: "/tools/chat",
    icon: MessageSquare,
  },
  {
    name: "AI Writer",
    label: "Viết hay hơn. Trong ít thời gian hơn.",
    description:
      "Từ dòng caption đầu tiên đến email quan trọng. Biến ý tưởng thô thành nội dung có giọng điệu của riêng bạn.",
    href: "/tools/writer",
    icon: PenLine,
  },
  {
    name: "AI PDF",
    label: "Tài liệu dài. Câu trả lời gọn.",
    description:
      "Tóm tắt và hỏi đáp từ phần văn bản PDF được xử lý. Luôn hiển thị rõ giới hạn trang và nội dung đã đọc.",
    href: "/tools/pdf",
    icon: FileText,
  },
];
export function Navigation() {
  return (
    <header className="container">
      <nav className="site-nav" aria-label="Điều hướng chính">
        <Brand />
        <div className="nav-links">
          <Link href="/#tools">Công cụ</Link>
          <Link href="/pricing">Bảng giá</Link>
          <Link href="/#faq">Câu hỏi thường gặp</Link>
        </div>
        <div className="nav-actions">
          <Button variant="ghost" asChild>
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              Bắt đầu miễn phí <ArrowUpRight size={14} />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
export function ToolCards({ dashboard = false }: { dashboard?: boolean }) {
  return (
    <div className={`tool-grid ${dashboard ? "dashboard-tools" : ""}`}>
      {tools.map((tool, i) => (
        <Link href={tool.href} className="tool-card" key={tool.name}>
          <span className="tool-number">0{i + 1} /</span>
          <div className="tool-icon">
            <tool.icon size={22} />
          </div>
          <h3>{tool.name}</h3>
          <p>{dashboard ? tool.label : tool.description}</p>
          <span className="card-link">
            Mở công cụ <ArrowUpRight size={14} />
          </span>
        </Link>
      ))}
    </div>
  );
}
export function Pricing() {
  return (
    <div className="pricing-grid">
      <article className="price-card">
        <span className="eyebrow">Cho khởi đầu của bạn</span>
        <h3 className="mt-4">Free</h3>
        <div className="price">
          0đ <small>/ mãi miễn phí</small>
        </div>
        <p className="mt-3">Đủ để khám phá cách làm việc mới.</p>
        <ul>
          {[
            "15 lượt yêu cầu AI mỗi ngày (UTC)",
            "Sử dụng Chat, Writer và PDF",
            "Lưu lịch sử trò chuyện",
            "PDF tối đa 4 MB, 80 trang; đọc 20 trang đầu",
          ].map((t) => (
            <li key={t}>
              <Check size={14} />
              {t}
            </li>
          ))}
        </ul>
        <Button variant="outline" asChild>
          <Link href="/register">
            Bắt đầu miễn phí <ArrowRight size={14} />
          </Link>
        </Button>
      </article>
      <article className="price-card featured">
        <span className="pill">Đang phát triển</span>
        <h3 className="mt-4">Pro</h3>
        <div className="price">Sắp ra mắt</div>
        <p className="mt-3">Thêm không gian cho những ý tưởng lớn.</p>
        <ul>
          {[
            "Dự kiến nâng giới hạn sử dụng",
            "Dự kiến thêm công cụ chuyên sâu",
            "Chưa mở đăng ký trả phí",
            "Giá và quyền lợi sẽ được công bố sau",
          ].map((t) => (
            <li key={t}>
              <Check size={14} />
              {t}
            </li>
          ))}
        </ul>
        <Button variant="outline" asChild>
          <Link href="/#faq">
            Tìm hiểu thêm <ArrowUpRight size={14} />
          </Link>
        </Button>
      </article>
    </div>
  );
}
export function Footer() {
  return (
    <footer className="container footer">
      <div>
        <Brand />
        <p>
          © {new Date().getFullYear()} Hàn Phong AI Tools. Tạo giá trị từ những
          ý tưởng.
        </p>
      </div>
      <div className="footer-links">
        <Link href="/pricing">Bảng giá</Link>
        <Link href="/#faq">Hỗ trợ & quyền riêng tư</Link>
        <Link href="/dashboard">
          Không gian làm việc <ArrowUpRight size={12} className="inline" />
        </Link>
      </div>
    </footer>
  );
}
