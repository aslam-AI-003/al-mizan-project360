import { Bell } from "lucide-react";
import { prisma } from "@/lib/db";
import { getClientContext } from "@/lib/client-data";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

export default async function ClientNotificationsPage() {
  const { session } = await getClientContext();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Notifications</h2>
        <p className="text-sm text-black/50">Updates about your project.</p>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="You'll see project updates here as they happen." />
      ) : (
        <div className="card divide-y divide-black/5">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-4">
              <div
                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-black/10" : "bg-brand-gold"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">{n.title}</p>
                <p className="text-sm text-black/60">{n.message}</p>
                <p className="mt-1 text-xs text-black/40">{formatDateTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
