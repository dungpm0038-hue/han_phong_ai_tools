"use client";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { signIn, signUp, type AuthState } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
export function AuthForm({
  register = false,
  configured,
}: {
  register?: boolean;
  configured: boolean;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    register ? signUp : signIn,
    {},
  );
  return (
    <div className="auth-form">
      <span className="eyebrow">KHÔNG GIAN CỦA BẠN</span>
      <h1>{register ? "Điều mới bắt đầu từ đây." : "Chào mừng trở lại."}</h1>
      <p>
        {register
          ? "Tạo tài khoản miễn phí và bắt đầu với 15 lượt AI mỗi ngày."
          : "Đăng nhập để tiếp tục những ý tưởng còn dang dở."}
      </p>
      {!configured && (
        <div className="notice error-notice" role="status">
          Chưa cấu hình Supabase. Quản trị viên cần thêm biến môi trường trong
          .env.local hoặc Vercel.
        </div>
      )}
      <form action={action}>
        <fieldset disabled={pending || !configured} className="stack">
          {register && (
            <div>
              <label htmlFor="display_name">Tên của bạn</label>
              <input
                id="display_name"
                name="display_name"
                autoComplete="name"
                maxLength={80}
                placeholder="Nguyễn Minh Anh"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="email">Địa chỉ email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="ban@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={10}
              maxLength={128}
              placeholder="Tối thiểu 10 ký tự"
              required
            />
          </div>
          <Button type="submit">
            {pending ? (
              <LoaderCircle size={16} className="spinner" />
            ) : (
              <>
                {register ? "Tạo tài khoản" : "Đăng nhập"}
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </fieldset>
        {state.error && (
          <div role="alert" className="notice error-notice">
            {state.error}
          </div>
        )}
        {state.success && (
          <div role="status" className="notice">
            {state.success}
          </div>
        )}
      </form>
      <div className="auth-footer">
        {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
        <Link href={register ? "/login" : "/register"}>
          {register ? "Đăng nhập" : "Đăng ký miễn phí"}
        </Link>
      </div>
      <p className="text-xs mt-6">
        Bằng việc tiếp tục, bạn hiểu rằng nội dung AI có thể chưa chính xác. Xem{" "}
        <Link className="text-link" href="/#faq">
          cách chúng tôi xử lý dữ liệu
        </Link>
        .
      </p>
    </div>
  );
}
