# Các bước còn lại để mở website công khai

Website hiện tại: <https://han-phong-ai-tools.vercel.app>. Auth/password login, dữ liệu riêng từng tài khoản, CRUD, PDF, quota, settings và logout đã có kiểm thử thật. Các tài khoản fixture đã xóa.

## OpenAI

Probe thật trên bản chẩn đoán đã xác định `AI_PROVIDER_QUOTA`: project OpenAI chưa đủ tín dụng/hạn mức hoặc bị giới hạn chi tiêu. Không phải giới hạn 15 lượt của ứng dụng; quota ngày đã hoàn lại. Chẩn đoán chỉ ghi status, mã/type được whitelist và các giới hạn số học, không ghi key, prompt hoặc message gốc. Cần chủ tài khoản kiểm tra đúng project API; không đổi model hoặc cộng quota DB để che lỗi provider.

Chủ tài khoản có thể kiểm tra [Limits](https://platform.openai.com/settings/organization/limits) và [Billing](https://platform.openai.com/settings/organization/billing/overview). Quyền ChatGPT Plus không tự cung cấp tín dụng API. Agent không tự mua credit, thêm phương thức thanh toán hoặc nâng plan.

## Email đăng ký

Người dùng xác nhận chưa có dịch vụ SMTP. Supabase đã trả lỗi rõ ràng: free tier dùng default email provider không cho sửa email template; cần custom SMTP hoặc nâng plan. Chưa áp dụng thay đổi template thất bại, chưa gửi mail thử và vẫn giữ xác nhận email bật.

Đề xuất dùng một dịch vụ email giao dịch hỗ trợ SMTP, ví dụ Resend. Chủ tài khoản cần tạo/chọn tài khoản dịch vụ và xác minh sender/domain. Không gửi mật khẩu hoặc API key qua chat.

Những giá trị cần có trước khi cấu hình thật:

| Giá trị                | Ghi chú                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| SMTP host và port      | Theo nhà cung cấp; port gửi như string trong Supabase Management API       |
| SMTP username/password | Nhập qua kênh cấu hình an toàn hoặc trực tiếp trong Supabase SMTP Settings |
| Sender email           | Địa chỉ đã xác minh với nhà cung cấp, dự kiến dưới domain của website      |
| Sender name            | Hàn Phong AI Tools                                                         |

Template tiếng Việt đã chuẩn bị tại [confirmation.html](../supabase/templates/confirmation.html), giữ `{{ .ConfirmationURL }}` và `{{ .SiteURL }}` để tương thích PKCE. Chỉ áp dụng sau khi SMTP thật sẵn sàng; không dùng SMTP giả để vượt giới hạn gói.

Sau cấu hình cần chủ tài khoản đăng ký bằng một mailbox do mình kiểm soát, nhận email, mở link cùng trình duyệt và kiểm tra đăng nhập. Các tài khoản fixture xác nhận bằng SQL không chứng minh gửi/nhận email hoạt động.

## Domain tại Nhân Hòa — phương án chờ duyệt

DNS hiện tại do Nhân Hòa quản lý, nameservers `ns1/2/3/4.zonedns.vn`. Vercel đã nhận `nghiemhanphong.id.vn`, `verified=true`; điều này chưa xác nhận DNS routing hoặc HTTPS cuối cùng.

Đề xuất tối thiểu dựa trên cấu hình Vercel hiện tại:

| Bản ghi                              | Hiện tại                    | Đề xuất                                    |
| ------------------------------------ | --------------------------- | ------------------------------------------ |
| A gốc (`@` / `nghiemhanphong.id.vn`) | `199.36.158.100` (Firebase) | `216.198.79.1` (IPv4 rank 1 do Vercel trả) |
| TTL                                  | Theo cấu hình hiện có       | Giữ nguyên                                 |
| MX/TXT và bản ghi khác               | Theo cấu hình hiện có       | Giữ nguyên                                 |

Chủ domain cần đồng ý việc chuyển domain khỏi website Firebase cũ trước khi thay bản ghi. Agent chưa được cấp phiên quản trị Nhân Hòa, nên còn cần quyền DNS phù hợp hoặc chủ tài khoản thực hiện một thay đổi theo hướng dẫn trong giao diện. Không gửi mật khẩu đăng nhập DNS trong chat.

Trước khi ghi cần xem zone thực tế, kiểm tra CNAME/AAAA xung đột và giữ MX/TXT. Không áp dụng đồng thời A và CNAME ở cùng tên gốc. Phương án rollback DNS là khôi phục A `199.36.158.100`; không xóa dữ liệu Supabase khi rollback.

Sau khi thay DNS được duyệt: kiểm tra routing và HTTPS thực tế, bổ sung callback domain mới trong Supabase, đổi canonical Site URL ở Supabase/Vercel, redeploy, rồi chuyển URL Vercel cũ sang domain chính nếu phù hợp. Kiểm tra Auth/Origin và cả ba công cụ trên domain mới. Không đổi canonical khi DNS vẫn trỏ Firebase.
