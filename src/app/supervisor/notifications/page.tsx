import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { markAllRead, markOneRead } from "./actions";

export default async function SupervisorNotificationsPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Notifications</h2>
          <p className="text-sm text-black/50">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button type="submit" className="btn-outline btn-sm">Mark all read</button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="card divide-y divide-black/5">
          {notifications.map((n) => (
            <form key={n.id} action={markOneRead}>
              <input type="hidden" name="notificationId" value={n.id} />
              <input type="hidden" name="link" value={n.link ?? ""} />
              <button type="submit" className="block w-full text-left">
                <div className={`flex items-start gap-3 p-4 ${n.read ? "" : "bg-brand-navy/[0.03]"}`}>
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-brand-gold"}`} />
                  <div className="min-w-0">
                    <p className={`text-sm text-[var(--foreground)] ${n.read ? "font-medium" : "font-bold"}`}>{n.title}</p>
                    <p className="text-xs text-black/60">{n.message}</p>
                    <p className="mt-1 text-xs text-black/40">{formatDateTime(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
