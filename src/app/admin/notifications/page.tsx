import { Bell } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { markAllRead, openNotification } from "./actions";

export default async function NotificationsPage() {
  const session = await getSession();
  const notifications = session
    ? await prisma.notification.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Notifications</h2>
          <p className="text-sm text-black/50">{unreadCount} unread of {notifications.length}.</p>
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
            <form key={n.id} action={openNotification}>
              <input type="hidden" name="id" value={n.id} />
              <input type="hidden" name="link" value={n.link ?? ""} />
              <button
                type="submit"
                className={`flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-black/[0.02] ${
                  !n.read ? "bg-brand-navy/[0.03]" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-gold" />}
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">{n.title}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-black/60">{n.message}</p>
                  <p className="mt-1 text-xs text-black/40">{formatDateTime(n.createdAt)}</p>
                </div>
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
