import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main id="main" className="empty-state section">
      <span className="eyebrow">404 / LẠC MỘT CHÚT THÔI</span>
      <h1 className="text-4xl mt-6">Trang này chưa có ở đây.</h1>
      <p>Quay lại không gian quen thuộc và bắt đầu một ý tưởng mới.</p>
      <Button asChild>
        <Link href="/">Về trang chủ</Link>
      </Button>
    </main>
  );
}
