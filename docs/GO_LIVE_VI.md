# Đưa Hàn Phong AI Tools lên website

Tài liệu này dành cho chủ tài khoản triển khai lần đầu. Repository đã có ứng dụng Next.js và cấu hình Vercel. Website chỉ có thể sử dụng đầy đủ sau khi Supabase, OpenAI, Auth và các biến môi trường được cấu hình thật. Đẩy mã lên GitHub hoặc xuất bản môi trường Codex chưa tạo website Vercel.

Không gửi mật khẩu, API key hoặc token trong chat. Nhập chúng trực tiếp trong giao diện dịch vụ. Hiện chưa có project Vercel/Supabase được kết nối với phiên Codex; các bước tạo tài khoản, cấp quyền GitHub và thanh toán dịch vụ cần chủ tài khoản thực hiện.

## 1. Tạo Supabase

1. Mở <https://supabase.com/dashboard>, đăng nhập bằng GitHub hoặc email.
2. Tạo organization nếu được yêu cầu, rồi chọn **New project**.
3. Đặt tên `han-phong-ai-tools`, chọn khu vực gần người dùng (ví dụ Singapore nếu có), tạo mật khẩu database mạnh và lưu trong trình quản lý mật khẩu.
4. Đợi project sẵn sàng.
5. Mở **SQL Editor**, tạo query mới. Sao chép toàn bộ SQL từ [migration](../supabase/migrations/202610310001_initial.sql) trong repository và chạy **một lần** trên project mới. Kiểm tra không có lỗi. Migration tạo bảng, RLS, trigger và các hàm quota; không chạy lặp lại nếu đã áp dụng.
6. Trong phần Connect / Settings / API Keys, lấy Project URL và publishable key. Lấy khóa `service_role` trong mục khóa API legacy nếu cần. Khóa service-role chỉ dùng ở server và không được đặt trong tên biến `NEXT_PUBLIC_`.

Không cần cài PostgreSQL hay Supabase CLI trên máy nếu dùng SQL Editor.

## 2. Chuẩn bị OpenAI

1. Mở <https://platform.openai.com/>, đăng nhập và tạo/chọn project API.
2. Tạo API key cho project và lưu an toàn.
3. Kiểm tra project có quyền gọi `gpt-4.1-mini`; nếu chọn model khác, đặt tên model vào `OPENAI_MODEL` và kiểm tra tương thích Chat Completions.
4. Tự cấu hình billing/budget và theo dõi chi phí theo chính sách tài khoản. Gói ChatGPT của bạn không tự cung cấp hạn mức OpenAI API.

Không có OpenAI API key/hạn mức thì các công cụ AI chưa hoạt động, dù landing page vẫn hiển thị.

## 3. Tạo project Vercel từ GitHub

1. Mở <https://vercel.com/new> và đăng nhập bằng GitHub.
2. Cấp quyền cho Vercel truy cập repository `dungpm0038-hue/han_phong_ai_tools`, rồi chọn **Import**.
3. Chọn Framework **Next.js**, Root Directory là thư mục gốc repository (`./`), Node.js **24.x**. Install Command `npm ci`; Build Command `npm run build`; Output Directory giữ mặc định Next.js.
4. Repository có file Firebase cũ để bảo toàn lịch sử. Deploy ứng dụng này bằng Next.js; không chọn static export hoặc thư mục `public` làm Output Directory.
5. Thêm các biến bên dưới trong **Environment Variables**, chọn môi trường **Production**. Chỉ thêm Preview khi có cấu hình staging tương ứng.

| Tên biến                               | Giá trị nhập trong Vercel                                                 |
| -------------------------------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project URL từ Supabase                                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key của đúng project                                          |
| `SUPABASE_SERVICE_ROLE_KEY`            | Service-role key của đúng project; server-only                            |
| `OPENAI_API_KEY`                       | API key OpenAI; server-only                                               |
| `OPENAI_MODEL`                         | `gpt-4.1-mini` hoặc model tương thích đã kiểm tra                         |
| `NEXT_PUBLIC_SITE_URL`                 | Origin Production thực tế, ví dụ `https://ten-project-thuc-te.vercel.app` |

6. Nếu chưa biết Production Domain được Vercel cấp, deploy lần đầu để lấy domain trong **Settings → Domains**, sau đó điền/sửa `NEXT_PUBLIC_SITE_URL` và **Redeploy**. Trước khi hoàn tất bước này, đăng ký và các API có kiểm tra Origin chưa thể được coi là hoạt động.
7. Dùng domain Production ổn định được hiển thị cho project. Không đoán domain, không lấy URL của một deployment Preview bất kỳ, và không dùng `localhost` làm Site URL trên production.
8. Chọn **Deploy**, kiểm tra build thành công. Nếu thất bại, xem build log và xử lý lỗi; không đổi framework hay tắt kiểm tra để làm build qua.

`NEXT_PUBLIC_*` được Next.js sử dụng trong quá trình build. Sau mỗi lần thay đổi biến môi trường, cần redeploy để bản build sử dụng cấu hình mới.

## 4. Hoàn thiện Supabase Auth và kiểm thử trên domain Vercel

1. Trong Supabase **Authentication → URL Configuration**, đặt Site URL bằng đúng `NEXT_PUBLIC_SITE_URL` ở Vercel.
2. Thêm Redirect URL chính xác: `https://<production-domain-thuc-te>/auth/callback`.
3. Bật xác nhận email; dùng email template PKCE tiêu chuẩn có `ConfirmationURL`. Đặt mật khẩu tối thiểu 10 ký tự.
4. Đăng ký tài khoản thử và mở email xác nhận trong cùng trình duyệt đã đăng ký. Sau đó kiểm tra đăng nhập, đăng xuất và truy cập dashboard.
5. Cấu hình SMTP riêng và kiểm tra giới hạn/rate limit Auth trước khi mở đăng ký công khai. Email mặc định của Supabase có giới hạn và có thể chỉ gửi được cho địa chỉ được cho phép; không coi đó là hệ thống email production đã hoàn thiện.
6. Kiểm tra Chat gửi/lưu/tải lại/đổi tên/xóa; Writer tạo và copy nội dung; PDF tải tệp có văn bản, tóm tắt/hỏi đáp/xóa, hiển thị giới hạn trang/ký tự.
7. Kiểm tra bằng hai tài khoản để bảo đảm lịch sử/tài liệu không bị truy cập chéo. Kiểm tra API khi chưa đăng nhập, hạn mức AI và các lỗi tải PDF.

Lỗi **nguồn yêu cầu không hợp lệ** thường cần kiểm tra domain đang mở so với `NEXT_PUBLIC_SITE_URL`, rồi redeploy sau khi sửa. Không tắt kiểm tra Origin để khắc phục.

## 5. Gắn `nghiemhanphong.id.vn`

Chỉ thực hiện thay đổi DNS sau khi chủ domain phê duyệt các bản ghi cụ thể, nhất là khi domain đang trỏ tới website Firebase cũ.

1. Sau khi bản Vercel hoạt động, mở **Settings → Domains → Add** và nhập `nghiemhanphong.id.vn`.
2. Vercel sẽ hiển thị bản ghi DNS và/hoặc bản ghi xác minh cần cho đúng project. Ghi lại **Type, Name, Value** chính xác; không dùng IP được đoán từ hướng dẫn cũ.
3. Trong nhà cung cấp DNS của domain, kiểm tra bản ghi hiện có và phương án quay lại website cũ. Chỉ sửa những bản ghi đã được phê duyệt; giữ nguyên MX/TXT phục vụ email hoặc xác minh khác.
4. Đợi Vercel báo domain hợp lệ và HTTPS hoạt động.
5. Chuyển `NEXT_PUBLIC_SITE_URL` thành `https://nghiemhanphong.id.vn`, redeploy Vercel. Đồng thời cập nhật Supabase Site URL và thêm Redirect URL `https://nghiemhanphong.id.vn/auth/callback`.
6. Kiểm thử lại đăng ký/email/đăng nhập và cả ba công cụ trên domain cuối. Nếu domain Vercel không còn là origin được ứng dụng hỗ trợ, đặt redirect sang domain chính hoặc không sử dụng nó để gửi các yêu cầu đăng nhập/AI.

## 6. Khi nào có thể gọi là website hoạt động đầy đủ?

- Vercel báo deployment thành công và domain trả về HTTPS hợp lệ.
- Migration đã chạy; đăng ký, xác nhận email, đăng nhập và đăng xuất đã kiểm thử thật.
- Chat, Writer và PDF gọi OpenAI và lưu dữ liệu thật thành công.
- Hai tài khoản được tách dữ liệu; quota và lỗi giới hạn được kiểm tra.
- PDF worker được xác minh trên Vercel thực tế, không chỉ trong build local.
- Chính sách lưu trữ/xóa dữ liệu, SMTP, theo dõi chi phí và các mục production trong [DEPLOYMENT.md](DEPLOYMENT.md) được rà soát.

Không đưa bất kỳ API key hoặc mật khẩu nào vào GitHub. Nếu cần hỗ trợ, chỉ chia sẻ URL public, trạng thái project hoặc thông báo lỗi đã che thông tin nhạy cảm.
