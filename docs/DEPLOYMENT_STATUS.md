# Trạng thái triển khai — 01/11/2026

## Vercel production

- URL: <https://han-phong-ai-tools.vercel.app>
- Project: `han-phong-ai-tools`, team `nhp6` (Hobby).
- Project ID: `prj_mg9C46BABNVSsPMwO3eXZaqah2IR`.
- Team ID: `team_gMCOcp89zZHh3BgVfbEwaoxc`.
- Deployment đang phục vụ đã xác nhận: `dpl_6UqWf9V7dNGJh7F1YGgXmyJfbBYd`.
- Source commit đang phục vụ: `fd7c19bfa7978461f16994518b3b84b6e41549c7`.
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

## Cập nhật sau chấp thuận chuyển khóa

- Người dùng đã đồng ý chuyển đúng hai khóa Supabase sang Vercel. Đã cấu hình `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public) và `SUPABASE_SERVICE_ROLE_KEY` (encrypted, server-only) vào Production của đúng project; không in/log/ghi file giá trị khóa.
- Đã redeploy với các biến môi trường thật. Deployment `dpl_6UqWf9V7dNGJh7F1YGgXmyJfbBYd`, source `fd7c19bfa7978461f16994518b3b84b6e41549c7`, được Vercel xác nhận READY và gắn production alias.
- `OPENAI_API_KEY` đã có tên biến ở Production, nhưng các yêu cầu AI thật vẫn trả HTTP 503; chưa xác định được lỗi key, billing, model hay upstream. Không tuyên bố AI hoạt động.

## Kết quả smoke test trên production

Đã dùng hai tài khoản fixture xác nhận riêng bằng SQL, sau đó đăng nhập qua form thật và GoTrue thật. Không tự tạo JWT, không thêm route bỏ qua Auth, không tắt xác nhận email toàn cục, không gửi email cho người thật. Đây là kiểm tra password login và các API sau đăng nhập, chưa phải kiểm tra signup/email delivery.

- Hai tài khoản đăng nhập và mở dashboard thành công; quota ban đầu 0.
- Tạo/đổi tên cuộc trò chuyện thành công; đọc/sửa/xóa chéo tài khoản đều trả 404.
- Upload PDF thật trả 201, trích đúng 1 trang; tài khoản khác không nhìn thấy tài liệu và bị từ chối hỏi đáp tài liệu không sở hữu.
- Nội dung PDF không hợp lệ trả 422; sai MIME trả 415.
- Settings lưu tên thật trong DB; menu mobile mở/đóng bằng Escape được kiểm tra.
- Sáu reservation đồng thời trên PostgreSQL thật ở mốc đã dùng 14 lượt: chỉ 1 được giữ chỗ, 5 bị quota từ chối; API có đăng nhập trả 429 khi hết quota.
- Ba yêu cầu AI (Chat/Writer/PDF) đều trả 503. Các yêu cầu thất bại không tiêu hao quota ngày; used=0 sau ba lần lỗi.
- Xóa cuộc trò chuyện/tài liệu và đăng xuất thành công; API sau đăng xuất trả 401.
- Cả hai tài khoản fixture và các rows profile/session/refresh-token/conversation/document/usage của chúng đã xóa và kiểm tra còn 0. Không xóa dữ liệu của tài khoản khác.

## Bản sửa và blocker hiện tại

- Đã viết phân loại lỗi OpenAI bằng các mã cố định, phân biệt auth/quota/rate-limit/model/quyền/upstream; không phản chiếu message gốc, prompt, headers hoặc API key vào response/log.
- Bản sửa local đã đạt TypeScript, lint, production build và 23/23 test. Chưa deploy bản sửa đó nên chưa có chẩn đoán provider cuối cùng.
- Kiểm tra Vercel mới nhất: token vẫn xác thực user `dungpm0038-hue`, nhưng GET project trong team `nhp6` trả 403 `forbidden`: "Not authorized: Trying to access resource under scope nhp6. You must re-authenticate to this scope or use a token with access to this scope." Danh sách team của token hiện rỗng.
- Không thử truy cập vòng qua team, không tạo project khác để thay thế project đang bị từ chối quyền. Bản production đã deploy trước đó vẫn giữ nguyên.
- Chủ tài khoản cần token Vercel có scope team **nhp** (`nhp6`), cập nhật đúng `VERCEL_TOKEN` trong Secrets Codex và áp dụng cấu hình. Không cần gửi token trong chat hoặc thay Supabase token đang hoạt động.
- Sau khi quyền được khôi phục: redeploy bản sửa, kiểm tra lại mã lỗi AI, sửa cấu hình/model nếu cần và có thể; nếu billing/quota/key bên OpenAI không sử dụng được thì chủ tài khoản phải cập nhật trong Vercel hoặc tài khoản OpenAI. Không tự mua credit hay bật billing.
- SMTP riêng chưa cấu hình, nên chưa xác minh đăng ký/xác nhận email cho người dùng công khai. Cần SMTP được chủ tài khoản cấu hình trước public launch rộng rãi.

## Domain riêng — chỉ đọc, chưa áp dụng

Đã đọc cấu hình đề xuất từ Vercel cho `nghiemhanphong.id.vn`: `misconfigured=true`. Chưa thêm domain vào project, chưa xác minh ownership và chưa sửa DNS.

- Recommended IPv4 rank 1: `216.198.79.1`, `64.29.17.1`.
- Recommended CNAME rank 1: `885ca17c433c894f.vercel-dns-017.com.`

Đây là dữ liệu đề xuất từ API, không phải chỉ dẫn áp dụng đồng thời A và CNAME. Cần xem cấu hình hiện tại của nhà cung cấp DNS, chọn phương án Vercel yêu cầu cho project, kiểm tra ảnh hưởng website Firebase cũ và trình chủ domain phê duyệt các bản ghi cụ thể trước khi thay đổi. Sau khi domain/HTTPS được xác minh, cập nhật Site URL ở Vercel và Supabase rồi redeploy.
