# Hàn Phong AI Tools — tiến độ

Cập nhật: 31/10/2026. Mã nguồn được triển khai trong `/workspace/han_phong_ai_tools`; không deploy production, không thay đổi DNS và không triển khai thanh toán.

## Phase 1 — Thiết lập, kiến trúc và design system

- [x] Next.js App Router, React, TypeScript strict, Tailwind v4, cấu hình shadcn/ui và Button dựa trên Radix Slot/CVA.
- [x] Lucide, Motion với reduced motion, Sonner, font Manrope tự lưu có tiếng Việt, dark theme theo palette yêu cầu.
- [x] npm registry xác nhận stable Next 16.4.3 / React 19.3.1; npm install tạo lockfile thật, npm ci đã chạy lại thành công.
- [x] Kiến trúc, .env.example, gitignore secrets và cấu hình security headers.
- [x] Typecheck và production build đạt.

Ban đầu sandbox chặn kết nối proxy. Cài đặt và build đã thành công bằng cơ chế thực thi được cấp quyền của phiên, giữ nguyên TLS/checksum. Domain tài liệu nextjs.org vẫn bị network policy từ chối; đã tham khảo README/types của package chính thức được cài và registry metadata. Không tuyên bố đã truy cập các trang tài liệu bị chặn.

## Phase 2 — Landing, dashboard và responsive UI

- [x] Landing, tool showcase, pricing Free/Pro sắp ra mắt, FAQ xử lý dữ liệu và footer.
- [x] Sidebar responsive, menu mobile có focus trap/Escape, dashboard số liệu thật từ DB, settings.
- [x] Skeleton, toast, loading/error/not-found, keyboard skip link, biểu mẫu có label, favicon, sitemap và robots.
- [x] Chromium kiểm tra trang công khai ở 1440×1000 và 390×844: không overflow ngang, FAQ, điều hướng, guard auth, 404, skip link và không có browser runtime error.
- [x] Xem ảnh desktop/mobile và sửa animation để nội dung không bị ẩn khi reduced-motion hoặc chưa scroll.
- [ ] Kiểm tra trực quan workspace đã đăng nhập trên mobile/desktop — cần Supabase thật.

## Phase 3 — Supabase Auth và database

- [x] Đăng ký/đăng nhập, PKCE email callback, đăng xuất, session cookie HttpOnly/SameSite/Secure production, refresh qua proxy.
- [x] Guard riêng ở cả layout/page và từng API; không có demo bypass.
- [x] Sáu bảng yêu cầu, indexes, checks, FK ownership, RLS, grants tối thiểu, trigger tạo profile/subscription.
- [x] Migration đã được thực thi bằng PostgreSQL nhúng PGlite; test RLS, hạn chế sửa usage/plan và trigger đạt.
- [ ] Apply migration lên Supabase staging; kiểm tra đăng ký/email confirmation/login/logout, SMTP và cookies thực tế.

## Phase 4 — Chat, Writer và PDF

- [x] Chat tạo/lưu/lịch sử (tối đa 100 cuộc trò chuyện gần đây, 100 tin nhắn gần nhất mỗi cuộc), đổi tên và xóa.
- [x] Chat context giới hạn 12 tin nhắn / 18.000 ký tự; khóa OpenAI chỉ ở server, timeout và output cap.
- [x] Writer: blog, social, email, marketing, rewrite, summary; bốn giọng điệu; copy kết quả.
- [x] PDF: upload MIME/signature/parser validation, bounded reader, worker có timeout/heap guard, chỉ giữ text, tóm tắt/hỏi đáp/xóa.
- [x] PDF max 4 MiB / 80 trang; trích 20 trang đầu / 24.000 ký tự; hiển thị rõ phạm vi, không có OCR/full-document retrieval.
- [x] Test PDF thật: đọc text, cắt còn 20 trang, từ chối >80 trang, malformed và PDF không có text.
- [ ] Gọi OpenAI thật với các tool và kiểm tra end-to-end lưu dữ liệu — cần API key và Supabase.
- [ ] Kiểm tra PDF worker trên Vercel staging — chưa deploy.

AI hiện trả kết quả không streaming để hoàn tất lưu trữ và quota trước khi báo thành công. Không có phản hồi AI giả.

## Phase 5 — Bảo mật, quota và lỗi

- [x] Free 15 yêu cầu/người/ngày UTC, 5 yêu cầu được nhận/phút; lock profile row trong PostgreSQL để dùng được trên nhiều instance.
- [x] Idempotency theo user + UUID + input hash; replay completed, chặn pending/conflict/failed; lỗi giải phóng quota, stale pending hết hạn sau 5 phút ở lần claim tiếp theo.
- [x] Lưu chat và finalize usage trong cùng transaction; cross-user FK chặn ghi sai chủ sở hữu.
- [x] PDF 3 lần/phút, 20 lần/ngày và tối đa 20 tài liệu; recheck sức chứa atomically khi lưu sau parse.
- [x] Zod, byte limits kể cả khi Content-Length sai/thiếu, Origin checks, escaped text, server-only credentials, no-store API headers.
- [x] Test local các tình huống trên đạt. Script kiểm thử nhiều request đồng thời trên Supabase staging đã có.
- [ ] Chạy script concurrency/RLS trên Supabase thật; PGlite chỉ có một embedded connection, không thay thế kiểm thử nhiều kết nối.
- [ ] Thiết lập retention cleanup, quy trình xóa tài khoản, monitoring, SMTP/auth-abuse policy và global firewall trước mở public diện rộng.

## Phase 6 — Kiểm thử và chuẩn bị triển khai

- [x] `npm ci`: đạt.
- [x] `npm test`: 19/19 đạt, không skip (7 DB, 7 bounded-body/signature, 5 PDF worker).
- [x] `npm run typecheck`: đạt; tự tạo route types trước tsc.
- [x] `npm run lint`: đạt.
- [x] `npm run format:check`: đạt ở lượt kiểm tra cuối; chạy lại khi sửa tài liệu.
- [x] `npm run build`: production build đạt, đầy đủ routes yêu cầu.
- [x] `npm run test:browser`: đạt trên production server nội bộ, desktop và mobile với Supabase chưa cấu hình.
- [x] `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities.
- [x] README, architecture, hướng dẫn Vercel/domain và production checklist.
- [x] GitHub CI workflow được viết; chưa có remote CI run.
- [x] Đã lưu `install_script` và `start_skill` vào environment configuration draft; chưa publish snapshot môi trường.
- [ ] Supabase staging integration, OpenAI và Vercel: chưa chạy do thiếu credentials/approval tương ứng.

### Dependency audit

Audit đầy đủ báo 16 moderate findings trong nhánh công cụ lint phát triển, liên quan minimatch (GHSA-g3hv-75wg-m249). Audit production là 0. ESLint 9.39.5 bị npm đánh dấu hết hỗ trợ; giữ lại vì các plugin React/import/jsx-a11y hiện khai báo peer ESLint 9, chưa khai báo 10. Không dùng `audit fix --force` để hạ toolchain hoặc ép major override chưa tương thích. Cần theo dõi bản sửa upstream/toolchain; xem docs/DEPLOYMENT.md.

## Cần người dùng cấu hình để kiểm tra tích hợp

### Xuất cấu hình để lưu trên GitHub

- Đã xuất nguyên nội dung `install_script` từ draft revision 2 thành `scripts/setup.sh`.
- Đã xuất nguyên nội dung `start_skill` thành `docs/CLOUD_ENVIRONMENT.md`.
- `bash -n scripts/setup.sh` và Prettier check cho tài liệu đều đạt. Chưa chạy lại setup vì chỉ xuất file.
- Chưa commit/push. Origin đã xác nhận là `github.com/dungpm0038-hue/han_phong_ai_tools`; nhánh hiện tại `work` chưa có commit.

Tạo/chọn Supabase staging, apply migration, cấu hình Auth callback/SMTP rồi thêm các giá trị từ `.env.example` qua kênh cấu hình an toàn hoặc `.env.local` được gitignore. Đặt OpenAI key server-side và xác nhận quyền truy cập model. Không gửi secrets trong chat. Chỉ deploy Vercel hoặc đổi DNS sau phê duyệt riêng.
