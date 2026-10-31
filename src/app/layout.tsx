import type { Metadata } from "next";
import { Toaster } from "sonner";
import "@fontsource-variable/manrope";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://nghiemhanphong.id.vn",
  ),
  title: {
    default: "Hàn Phong AI Tools — Không gian cho ý tưởng",
    template: "%s | Hàn Phong AI Tools",
  },
  description:
    "Chat, viết nội dung và khám phá tài liệu với AI. Không gian làm việc tiếng Việt dành cho những ý tưởng của bạn.",
  openGraph: {
    locale: "vi_VN",
    type: "website",
    siteName: "Hàn Phong AI Tools",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body>
        <a href="#main" className="skip-link">
          Chuyển đến nội dung
        </a>
        {children}
        <Toaster theme="dark" richColors position="bottom-right" closeButton />
      </body>
    </html>
  );
}
