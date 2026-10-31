# Trạng thái triển khai — 01/11/2026

## Vercel production

- URL: <https://han-phong-ai-tools.vercel.app>
- Project: `han-phong-ai-tools`, team `nhp6` (Hobby).
- Project ID: `prj_mg9C46BABNVSsPMwO3eXZaqah2IR`.
- Team ID: `team_gMCOcp89zZHh3BgVfbEwaoxc`.
- Deployment ID: `dpl_4JnAUpEK4i8PSKjea5EGEMd4iYzF`.
- Source commit: `a5b982cc28f62a05c046123f0feb4864ae18d90c`.
- Vercel Management API đã xác nhận `readyState=READY`, `aliasAssigned=true`, không có deployment error.
- Node.js 24, Next.js, install `npm ci`, build `npm run build`.
- `NEXT_PUBLIC_SITE_URL` đã đặt bằng URL production ở trên.
- Website được cấu hình truy cập công khai; các route ứng dụng vẫn dùng Supabase Auth/RLS để bảo vệ dữ liệu.

Triển khai trực tiếp 81 file lấy từ Git commit (638.534 byte), không upload node_modules, build local hoặc secrets. Tài khoản chưa cài Vercel GitHub App, nên deployment này **chưa có tự động triển khai khi push GitHub**. Cần kết nối tại <https://github.com/apps/vercel> và liên kết đúng repository nếu muốn bật luồng đó. Các commit chỉ cập nhật tài liệu sau source commit ở trên chưa tự tạo deployment mới.

## Đã và chưa xác minh

- Build cloud Vercel hoàn tất, production alias được gắn.
- Bản sửa PDF production đã được kiểm thử với compiled worker và local Auth/RPC fixtures trước khi upload; chưa phải kiểm thử PDF trên Vercel với Supabase thật.
- Runtime có token Vercel sử dụng được. `SUPABASE_ACCESS_TOKEN`, khóa ứng dụng Supabase và OpenAI chưa có trong phiên được kiểm tra.
- Chưa chạy migration hoặc cấu hình Auth trên project Supabase thật của người dùng; ảnh Healthy chưa cấp quyền quản trị.
- Chưa xác minh trực tiếp HTTP của URL production từ môi trường Codex: proxy trả 403 ở bước CONNECT. Domain production đã được thêm vào allowlist của **draft**, giữ nguyên các miền API hiện có, nhưng agent chưa Publish/apply thay đổi đó.
- Các tính năng cần Supabase/OpenAI hiện chưa sẵn sàng; guard Auth/API vẫn giữ nguyên, không có mock dữ liệu hoặc bỏ qua xác thực.

## Bước tiếp theo

1. Nhập `SUPABASE_ACCESS_TOKEN` qua phần Secrets trong cài đặt môi trường Codex (không qua chat); giữ binding Vercel đã hoạt động. Lưu và Publish cấu hình nếu giao diện yêu cầu để áp dụng token cùng quyền truy cập domain mới.
2. Sau khi Management API hoạt động, kiểm tra đúng project Supabase đã tạo, áp dụng migration nếu schema chưa có, cấu hình URL Auth và kiểm tra RLS. Không chạy lại migration tạo bảng một cách mù quáng.
3. Cấu hình các khóa ứng dụng vào Vercel bằng giá trị thực. Không sao chép placeholder của proxy sang Environment Variables của deployment.
4. OpenAI API key nhập trực tiếp ở <https://vercel.com/nhp6/han-phong-ai-tools/settings/environment-variables> với tên `OPENAI_API_KEY`, target Production. Không tự tạo billing hoặc mua credit thay chủ tài khoản.
5. Redeploy sau khi các biến môi trường thay đổi; kiểm thử đăng ký/email/đăng nhập, Chat, Writer, PDF và giới hạn với dịch vụ thật.

## Domain riêng — chỉ đọc, chưa áp dụng

Đã đọc cấu hình đề xuất từ Vercel cho `nghiemhanphong.id.vn`: `misconfigured=true`. Chưa thêm domain vào project, chưa xác minh ownership và chưa sửa DNS.

- Recommended IPv4 rank 1: `216.198.79.1`, `64.29.17.1`.
- Recommended CNAME rank 1: `885ca17c433c894f.vercel-dns-017.com.`

Đây là dữ liệu đề xuất từ API, không phải chỉ dẫn áp dụng đồng thời A và CNAME. Cần xem cấu hình hiện tại của nhà cung cấp DNS, chọn phương án Vercel yêu cầu cho project, kiểm tra ảnh hưởng website Firebase cũ và trình chủ domain phê duyệt các bản ghi cụ thể trước khi thay đổi. Sau khi domain/HTTPS được xác minh, cập nhật Site URL ở Vercel và Supabase rồi redeploy.
