import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

export default async function ClientLayout({ children }: LayoutProps<"/client">) {
  const session = await getSession();
  const unreadCount = session
    ? await prisma.notification.count({ where: { userId: session.userId, read: false } })
    : 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar role="CLIENT" brandLabel="Client Portal" name={session?.name ?? ""} roleLabel="Client" />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar title="Al-Mizan Project360" notificationsHref="/client/notifications" unreadCount={unreadCount} />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">{children}</main>
      </div>
      <BottomNav role="CLIENT" />
    </div>
  );
}
