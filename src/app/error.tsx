"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="empty-state section">
      <h1 className="text-3xl">Một nhịp gián đoạn.</h1>
      <p>Không thể tải dữ liệu lúc này. Kiểm tra kết nối và thử lại.</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={() => reset()}>Thử lại</Button>
        <Button variant="outline" asChild>
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </main>
  );
}
