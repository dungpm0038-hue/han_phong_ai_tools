import { requirePageUser } from "@/lib/page-auth";
import { SettingsForm } from "@/components/settings-form";
export const metadata = { title: "Cài đặt" };
export default async function Page() {
  const { db, user } = await requirePageUser();
  const { data, error } = await db
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">THEO CÁCH CỦA BẠN</span>
          <h1>Cài đặt tài khoản</h1>
          <p>Quản lý hồ sơ và không gian làm việc.</p>
        </div>
      </div>
      <SettingsForm name={data?.display_name || ""} email={user.email || ""} />
    </>
  );
}
