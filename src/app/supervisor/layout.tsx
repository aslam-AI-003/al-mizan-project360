import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

export default async function SupervisorLayout({ children }: LayoutProps<"/supervisor">) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen">
      <Sidebar role="SUPERVISOR" brandLabel="Project360" name={session?.name ?? ""} roleLabel="Site Supervisor" />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar title="Al-Mizan Project360" />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">{children}</main>
      </div>
      <BottomNav role="SUPERVISOR" />
    </div>
  );
}
