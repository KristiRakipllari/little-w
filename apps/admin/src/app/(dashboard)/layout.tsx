import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-x-hidden bg-background">{children}</main>
    </div>
  );
}
