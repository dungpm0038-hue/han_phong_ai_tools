import { requirePageUser } from "@/lib/page-auth";
import { WorkspaceShell } from "@/components/workspace-shell";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { db, user } = await requirePageUser();
  const { data: profile } = await db
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  return (
    <WorkspaceShell name={profile?.display_name || ""} email={user.email || ""}>
      {children}
    </WorkspaceShell>
  );
}
