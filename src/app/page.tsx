import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Command,
  FileText,
  GraduationCap,
  Layers,
  MessageSquare,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import { Navigation, ToolCards, Pricing, Footer } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
export default function Home() {
  return (
    <>
      <Navigation />
      <main id="main">
        <section className="hero">
          <div className="container">
            <div className="hero-grid">
              <div>
                <span className="pill">
                  <span className="dot" /> Một không gian. Nhiều khả năng.
                </span>
                <h1>
                  Bớt việc lặp lại.
                  <br />
                  Thêm <span className="gradient-text">điều khác biệt.</span>
                </h1>
                <p className="hero-copy">
                  Từ câu hỏi đầu tiên đến ý tưởng tiếp theo. Chat, viết và đọc
                  tài liệu cùng AI — trong một không gian dành riêng cho bạn.
                </p>
                <div className="hero-actions">
                  <Button asChild>
                    <Link href="/register">
                      Khám phá không gian của bạn <ArrowUpRight size={16} />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="#tools">
                      Xem các công cụ <ArrowRight size={15} />
                    </Link>
                  </Button>
                </div>
                <div className="hero-note">
                  <Check size={13} />
                  <span>
                    15 lượt AI miễn phí mỗi ngày. Không cần thẻ thanh toán.
                  </span>
                </div>
                <div className="hero-stats">
                  <span>
                    <Zap size={12} /> Bắt đầu trong vài phút
                  </span>
                  <span>
                    <ShieldCheck size={12} /> Lịch sử riêng tư
                  </span>
                  <span>
                    <Command size={12} /> Thiết kế cho sự tập trung
                  </span>
                </div>
              </div>
              <Reveal>
                <div
                  className="product-window"
                  aria-label="Minh họa giao diện AI Chat, không phải kết quả trực tiếp"
                >
                  <div className="window-top">
                    <i />
                    <i />
                    <i />
                    <span>HÀN PHONG / KHÔNG GIAN LÀM VIỆC · MINH HỌA</span>
                  </div>
                  <div className="window-body">
                    <div className="window-rail">
                      <Zap size={18} className="text-primary" />
                      <MessageSquare size={16} />
                      <PenLine size={16} />
                      <FileText size={16} />
                    </div>
                    <div className="window-chat">
                      <div className="window-label">
                        <Sparkles size={13} /> AI Chat{" "}
                        <span className="ml-auto">Ý tưởng bắt đầu ở đây</span>
                      </div>
                      <div className="demo-question">
                        Mình muốn bắt đầu một dự án sáng tạo.
                        <br />
                        Giúp mình tìm hướng đi nhé?
                      </div>
                      <div className="demo-reply">
                        <strong>Cùng biến ý tưởng thành bước đầu tiên.</strong>
                        Hãy bắt đầu từ điều bạn quan tâm nhất:
                        <ul>
                          <li>Một vấn đề bạn muốn giải quyết</li>
                          <li>Một kỹ năng bạn muốn chia sẻ</li>
                          <li>Một góc nhìn chưa được kể</li>
                        </ul>
                        <span className="text-violet-300">
                          Bạn đang nghĩ đến lĩnh vực nào?
                        </span>
                      </div>
                      <div className="demo-input">
                        Viết ý tưởng của bạn…{" "}
                        <span>
                          <Send size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
            <div className="trust-strip">
              <span>Dành cho mọi cách bạn làm việc</span>
              <strong>
                <GraduationCap size={16} /> Học tập
              </strong>
              <strong>
                <PenLine size={15} /> Sáng tạo nội dung
              </strong>
              <strong>
                <Layers size={16} /> Làm việc tự do
              </strong>
              <strong>
                <Command size={15} /> Công việc mỗi ngày
              </strong>
            </div>
          </div>
        </section>
        <section id="tools" className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Bộ công cụ của bạn</span>
              <h2>
                Ít thao tác hơn.
                <br />
                Nhiều việc được hoàn thành hơn.
              </h2>
            </div>
            <p>
              Không cần chuyển qua nhiều ứng dụng. Tìm đúng công cụ, bắt đầu
              ngay từ điều bạn đang cần.
            </p>
          </div>
          <Reveal>
            <ToolCards />
          </Reveal>
          <div className="feature-row">
            <div className="quote-panel">
              “Công cụ tốt nên giúp bạn tập trung vào điều mình muốn tạo ra.”
              <small>TRIẾT LÝ THIẾT KẾ / HÀN PHONG AI TOOLS</small>
            </div>
            <div className="feature-list">
              <div>
                <Timer size={21} />
                <h3>Đi thẳng vào công việc</h3>
                <p>
                  Một giao diện gọn gàng, không làm gián đoạn dòng suy nghĩ.
                </p>
              </div>
              <div>
                <ShieldCheck size={21} />
                <h3>Không gian riêng của bạn</h3>
                <p>
                  Tài khoản và lịch sử được phân quyền riêng theo người dùng.
                </p>
              </div>
              <div>
                <MessageSquare size={21} />
                <h3>Tự nhiên bằng tiếng Việt</h3>
                <p>
                  Từ giao diện đến câu trả lời, gần gũi với cách bạn làm việc.
                </p>
              </div>
              <div>
                <Sparkles size={21} />
                <h3>Bạn giữ quyền quyết định</h3>
                <p>AI gợi mở. Bạn kiểm tra, chỉnh sửa và tạo dấu ấn riêng.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="section pricing-section">
          <div className="container">
            <div className="center">
              <span className="eyebrow">Đơn giản từ đầu</span>
              <h2>
                Bắt đầu miễn phí.
                <br />
                Phát triển theo cách của bạn.
              </h2>
              <p>Khám phá cả ba công cụ với 15 lượt AI mỗi ngày.</p>
            </div>
            <Pricing />
          </div>
        </section>
        <section id="faq" className="section container">
          <div className="center mb-9">
            <span className="eyebrow">Một vài điều bạn muốn biết</span>
            <h2>Rõ ràng trước khi bắt đầu.</h2>
          </div>
          <div className="faq">
            {[
              [
                "Mình có cần trả phí để sử dụng không?",
                "Không. Gói Free có 15 yêu cầu AI mỗi ngày, đặt lại lúc 00:00 UTC (07:00 giờ Việt Nam). Yêu cầu lỗi không tính vào hạn mức; yêu cầu đang xử lý được giữ chỗ tạm thời. Gói Pro chưa mở thanh toán.",
              ],
              [
                "PDF được đọc và lưu như thế nào?",
                "Tệp tối đa 4 MB và 80 trang. Hệ thống xử lý tối đa 20 trang đầu và 24.000 ký tự; nếu bị cắt, giao diện sẽ thông báo. Chưa hỗ trợ OCR hoặc truy xuất toàn bộ tài liệu. Tệp gốc không được lưu; phần văn bản đã trích được lưu trong tài khoản và có thể xóa.",
              ],
              [
                "Dữ liệu của mình được gửi đến đâu?",
                "Tài khoản và nội dung đã lưu nằm trong Supabase. Nội dung câu hỏi, ngữ cảnh hội thoại gần đây hoặc phần trích PDF cần thiết được gửi đến OpenAI để tạo câu trả lời. Không tải lên tài liệu mà bạn không có quyền chia sẻ. Bạn có thể xóa cuộc trò chuyện và tài liệu trong ứng dụng.",
              ],
              [
                "AI có luôn trả lời đúng không?",
                "AI có thể sai hoặc thiếu ngữ cảnh. Hãy kiểm chứng thông tin quan trọng, đặc biệt là nội dung liên quan đến sức khỏe, tài chính hoặc pháp luật.",
              ],
              [
                "Có thể dùng trên điện thoại không?",
                "Có. Không gian làm việc được thiết kế cho cả điện thoại, máy tính bảng và máy tính. Mở menu để chuyển công cụ và truy cập cài đặt tài khoản.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
