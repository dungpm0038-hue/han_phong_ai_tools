import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth-form";
export function AuthPage({ register = false }: { register?: boolean }) {
  const configured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  return (
    <main id="main" className="auth-layout">
      <aside className="auth-story">
        <Brand />
        <blockquote>
          Ý tưởng của bạn.
          <br />
          <span className="gradient-text">Một chút trợ giúp.</span>
          <br />
          Nhiều điều có thể.
          <small>
            Không gian AI gọn gàng để học tập, sáng tạo và hoàn thành công việc
            mỗi ngày.
          </small>
        </blockquote>
        <small>HÀN PHONG AI TOOLS / LÀM VIỆC THEO CÁCH CỦA BẠN</small>
      </aside>
      <section className="auth-main">
        <AuthForm register={register} configured={configured} />
      </section>
    </main>
  );
}
