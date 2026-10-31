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

## Supabase thật đã cấu hình

- Project đã xác thực: `gernmdmumfmmnlwyxkiw`, trạng thái `ACTIVE_HEALTHY`.
- Đã áp dụng đúng initial SQL một lần qua Management migrations API. Lịch sử live ghi version `20261031181650`, name `han_phong_ai_tools_initial`; source là `supabase/migrations/202610310001_initial.sql`. Không chạy lại initial migration trên project này. Nếu chuyển sang quản lý bằng CLI, cần đối chiếu/repair lịch sử bằng công cụ Supabase trước khi db push, thay vì tạo lại các bảng.
- Sáu bảng đã tồn tại và bật RLS, 11 policy được kiểm tra qua database metadata.
- Năm RPC quota/PDF chỉ cho service_role thực thi; authenticated không được INSERT usage/messages/documents hoặc UPDATE subscriptions.
- Trigger `on_auth_user_created` và FK ownership `(conversation_id,user_id)` đã được xác minh.
- Auth Site URL là `https://han-phong-ai-tools.vercel.app`; redirect allowlist có đúng `/auth/callback`.
- Mật khẩu tối thiểu 10 ký tự; xác nhận email vẫn bật (`mailer_autoconfirm=false`). SMTP riêng chưa cấu hình, nên chưa xác minh gửi email cho người dùng công khai.

## Deployment và tích hợp còn thiếu

- Trang chủ production đã trả HTTP 200; branding và headline tiếng Việt được xác minh sau khi quyền network mới được người dùng áp dụng.
- Vercel Production đã có `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` và tên biến `OPENAI_API_KEY`. Chưa đọc giá trị OpenAI key hoặc xác minh model/billing.
- Hai khóa ứng dụng Supabase chưa được đọc/chuyển: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable hoặc anon) và `SUPABASE_SERVICE_ROLE_KEY` (service_role hoặc secret server key).
- Automatic approval review từ chối hành động đọc service-role key và chuyển sang Vercel do cần chấp thuận riêng cho đúng payload/destination. Không thử đường vòng hoặc thực hiện lại hành động bị từ chối. Không có khóa bị in ra hay ghi vào repository.
- Phạm vi đang chờ chủ tài khoản đồng ý: lấy hai khóa hiện có của đúng project `gernmdmumfmmnlwyxkiw`, lưu vào Environment Variables **Production** của Vercel `han-phong-ai-tools`, team `nhp6`, project ID `prj_mg9C46BABNVSsPMwO3eXZaqah2IR`, qua `api.vercel.com`. Public key dùng ở cấu hình public như Supabase thiết kế; service-role key lưu dạng encrypted, chỉ biến server, không có prefix NEXT_PUBLIC_. Không gửi khóa trong chat.
- Chưa redeploy sau thay đổi cấu hình Supabase vì hai khóa còn bị chặn; bản build hiện tại chưa bật đầy đủ đăng nhập/dashboard/AI.
- Bản sửa PDF đã qua compiled-worker/route tests với local fixtures; các công cụ và đăng nhập thực tế vẫn cần kiểm thử sau khi key được cấu hình và redeploy.

## Bước tiếp theo

1. Xin sự chấp thuận cụ thể cho việc đọc/chuyển hai khóa Supabase nói trên vào đúng Vercel project. Không yêu cầu chủ tài khoản gửi giá trị khóa trong chat.
2. Khi được chấp thuận, thực hiện chuyển trực tiếp qua API, không in/log/ghi file khóa. Không xoay hoặc tạo thêm key nếu khóa hiện có sử dụng được.
3. Redeploy production với cấu hình đầy đủ, kiểm tra Auth/session, Chat, Writer, PDF và quota với dịch vụ thật. Giữ nguyên RLS, email confirmation và các guard API.
4. Hoàn thiện SMTP riêng trước khi mở đăng ký email rộng rãi; không tự mua dịch vụ hoặc cấu hình billing thay chủ tài khoản.

## Domain riêng — chỉ đọc, chưa áp dụng

Đã đọc cấu hình đề xuất từ Vercel cho `nghiemhanphong.id.vn`: `misconfigured=true`. Chưa thêm domain vào project, chưa xác minh ownership và chưa sửa DNS.

- Recommended IPv4 rank 1: `216.198.79.1`, `64.29.17.1`.
- Recommended CNAME rank 1: `885ca17c433c894f.vercel-dns-017.com.`

Đây là dữ liệu đề xuất từ API, không phải chỉ dẫn áp dụng đồng thời A và CNAME. Cần xem cấu hình hiện tại của nhà cung cấp DNS, chọn phương án Vercel yêu cầu cho project, kiểm tra ảnh hưởng website Firebase cũ và trình chủ domain phê duyệt các bản ghi cụ thể trước khi thay đổi. Sau khi domain/HTTPS được xác minh, cập nhật Site URL ở Vercel và Supabase rồi redeploy.
