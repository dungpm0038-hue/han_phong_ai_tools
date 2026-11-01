# Trạng thái triển khai — 01/11/2026

## Đang hoạt động

- URL: <https://han-phong-ai-tools.vercel.app>.
- Vercel project: `han-phong-ai-tools`, team `nhp6` (Hobby), Node.js 24.
- Project ID: `prj_mg9C46BABNVSsPMwO3eXZaqah2IR`; team ID: `team_gMCOcp89zZHh3BgVfbEwaoxc`.
- Deployment hiện tại: `dpl_CijoYpbkCYfbdG9N3K6TMprB6V7x`, source `02a45d9762538f1d27a0350bbbf66c3a052aa7d6`, Vercel xác nhận READY và aliasAssigned=true.
- Đã redeploy sau khi quyền Vercel team được khôi phục; hiện không còn blocker token scope nhp6.
- Deploy bằng source upload qua API, vì Vercel GitHub App chưa kết nối. Push GitHub chưa tự tạo deployment. Các commit tài liệu sau source commit trên không tự thay phiên bản website.
- Các biến Production đã có: Site URL, Supabase URL/public key, service-role encrypted/server-only và OpenAI key sensitive. Không in hoặc commit giá trị khóa.

## Database và Auth đã cấu hình thật

- Supabase project: `gernmdmumfmmnlwyxkiw`, ACTIVE_HEALTHY.
- Initial migration đã chạy một lần qua Management migrations API; history version `20261031181650`, name `han_phong_ai_tools_initial`, source `supabase/migrations/202610310001_initial.sql`.
- Sáu bảng đều bật RLS, 11 policy đã xác minh. Năm RPC quota/PDF chỉ cho service_role; client không được tự INSERT usage/messages/documents hoặc UPDATE subscriptions.
- Trigger tạo profile/subscription và FK ownership `(conversation_id,user_id)` đã xác minh.
- Site URL hiện vẫn là URL Vercel; callback chính xác `/auth/callback`; mật khẩu tối thiểu 10 ký tự; xác nhận email giữ bật.
- Không chạy lại initial migration trên project này. Nếu chuyển sang CLI, đối chiếu/repair migration history trước db push thay vì tạo lại các bảng.

## Kiểm thử đã thực hiện

- Hai tài khoản fixture đăng nhập qua UI/password và GoTrue thật, mở dashboard, dùng dữ liệu riêng; không tạo JWT hoặc route bỏ qua Auth.
- Conversation CRUD/đổi tên đạt; đọc/sửa/xóa chéo tài khoản đều 404.
- PDF thật upload/trích xuất trên Vercel trả 201, báo đúng phạm vi; tài khoản khác không đọc/hỏi tài liệu của chủ khác.
- PDF sai nội dung 422, sai MIME 415; settings/mobile menu/Escape, xóa dữ liệu và logout/401 đạt.
- PostgreSQL thật nhận sáu reservation đồng thời khi đã dùng 14 lượt: chỉ một được giữ chỗ, năm bị quota từ chối; API sau đăng nhập trả 429 khi hết quota.
- Các probe AI thất bại đều hoàn quota; used=0. Tài khoản fixture và profile/session/refresh-token/app data của chúng đã xóa, verified còn 0.
- Local production build, typecheck, lint, format check và 25/25 test đạt. Chẩn đoán provider chỉ nhận category được whitelist và header giới hạn số học, không ghi raw message/key/prompt.

## Blocker OpenAI đã xác định

Sau bản sửa đọc thêm loại lỗi quota, yêu cầu thật trả `AI_PROVIDER_QUOTA`: tài khoản/project OpenAI chưa đủ hạn mức API, tín dụng hoặc bị giới hạn chi tiêu. Đây không phải quota 15 lượt của ứng dụng và không thể tự sửa bằng việc cộng lượt trong DB. Không còn chỉ là lỗi 503 không rõ nguyên nhân.

Chủ tài khoản cần kiểm tra đúng project tạo key tại [Limits](https://platform.openai.com/settings/organization/limits) và [Billing](https://platform.openai.com/settings/organization/billing/overview). Không tự mua credit, nâng plan hoặc thay key bằng tài khoản khác. Sau khi chủ tài khoản cập nhật hạn mức/key, redeploy nếu biến môi trường đổi và chạy lại probe AI; chỉ tuyên bố AI hoạt động khi có phản hồi thật.

## Email còn thiếu SMTP

Người dùng xác nhận chưa có SMTP. Supabase API trả rõ: free tier dùng default email provider không cho sửa email template; cần custom SMTP hoặc nâng plan. Các PATCH template bị từ chối, không áp dụng; email confirmation vẫn bật.

Template tiếng Việt chuẩn bị tại `supabase/templates/confirmation.html`, giữ ConfirmationURL/SiteURL chuẩn. Cần provider SMTP thật và sender đã xác minh trước khi áp dụng template và kiểm thử signup/email bằng mailbox do chủ tài khoản kiểm soát. Không dùng SMTP giả, không tắt xác nhận email và không tự nâng gói. Fixture đã xác nhận riêng chỉ kiểm tra login, không chứng minh email signup đã gửi/nhận.

## Domain Nhân Hòa — chưa chuyển DNS

- Chủ tài khoản xác nhận quản lý DNS tại Nhân Hòa; NS là `ns1/2/3/4.zonedns.vn`.
- Đã khai báo `nghiemhanphong.id.vn` vào đúng project Vercel, verified=true. Owner verification không đồng nghĩa routing/HTTPS đã hoàn tất.
- DNS A hiện tại vẫn `199.36.158.100` (Firebase); Vercel báo misconfigured=true, CNAME/conflicts trả về rỗng.
- Phương án chờ duyệt: chỉ đổi A gốc (`@` / `nghiemhanphong.id.vn`) từ `199.36.158.100` sang `216.198.79.1` (rank-1 IPv4 Vercel trả). Giữ TTL, MX/TXT và các bản ghi khác.
- Chưa được cấp phiên quản trị DNS Nhân Hòa và chưa ghi DNS. Phải xem zone thực tế, kiểm tra IPv6/CNAME xung đột và được chủ domain đồng ý trước khi đổi. Rollback A là `199.36.158.100`.
- Sau cutover được duyệt cần xác minh routing/HTTPS, cập nhật canonical Site URL và exact callbacks ở Supabase/Vercel, redeploy và kiểm tra lại Auth/Origin/công cụ.
- Đã thêm riêng domain vào network allowlist của draft Codex, giữ nguyên ba miền hiện có. Chưa tự Publish môi trường; chủ tài khoản cần xem/lưu và Publish cấu hình khi chuẩn bị kiểm tra HTTPS domain từ Codex.

Chi tiết phương án: [LAUNCH_REMAINING_VI.md](LAUNCH_REMAINING_VI.md). Website chưa được gọi là hoàn thiện AI/email/domain khi các blocker bên ngoài này còn tồn tại.
