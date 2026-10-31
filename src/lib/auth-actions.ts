"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(10).max(128),
});
export type AuthState = { error?: string; success?: string };
export async function signIn(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success)
    return { error: "Nhập email hợp lệ và mật khẩu tối thiểu 10 ký tự." };
  try {
    const db = await supabaseServer();
    const { error } = await db.auth.signInWithPassword(parsed.data);
    if (error)
      return {
        error: "Email hoặc mật khẩu không đúng, hoặc email chưa được xác nhận.",
      };
  } catch {
    return {
      error: "Chưa kết nối được Supabase. Kiểm tra cấu hình môi trường.",
    };
  }
  redirect("/dashboard");
}
export async function signUp(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const parsed = credentials
    .extend({ display_name: z.string().trim().min(1).max(80) })
    .safeParse({
      email: form.get("email"),
      password: form.get("password"),
      display_name: form.get("display_name"),
    });
  if (!parsed.success)
    return {
      error: "Vui lòng nhập tên, email hợp lệ và mật khẩu từ 10 đến 128 ký tự.",
    };
  try {
    const db = await supabaseServer();
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (!site) return { error: "Chưa cấu hình địa chỉ ứng dụng." };
    const { error } = await db.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.display_name },
        emailRedirectTo: new URL("/auth/callback", site).toString(),
      },
    });
    if (error)
      return {
        error:
          "Chưa thể đăng ký. Thử lại sau hoặc đăng nhập nếu đã có tài khoản.",
      };
    return {
      success:
        "Nếu địa chỉ đủ điều kiện đăng ký, email xác nhận sẽ được gửi đến hộp thư của bạn. Hãy kiểm tra cả thư rác.",
    };
  } catch {
    return {
      error: "Chưa kết nối được Supabase. Kiểm tra cấu hình môi trường.",
    };
  }
}
