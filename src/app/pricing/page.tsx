import { Navigation, Pricing, Footer } from "@/components/marketing";
export const metadata = { title: "Bảng giá" };
export default function PricingPage() {
  return (
    <>
      <Navigation />
      <main id="main" className="section container">
        <div className="center">
          <span className="eyebrow">Bảng giá minh bạch</span>
          <h1 className="mt-5">Không gian cho mọi khởi đầu.</h1>
          <p>15 lượt AI mỗi ngày. Ba công cụ. Bắt đầu miễn phí.</p>
        </div>
        <Pricing />
        <p className="center mt-8 text-xs">
          Hạn mức đặt lại lúc 07:00 giờ Việt Nam (00:00 UTC). Pro chưa mở thanh
          toán.
        </p>
      </main>
      <Footer />
    </>
  );
}
