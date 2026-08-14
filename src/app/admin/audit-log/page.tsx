import { ScrollText } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, role: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Audit Log</h2>
        <p className="text-sm text-black/50">Most recent {logs.length} action(s) across the system.</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity yet" description="Actions taken by users will appear here." />
      ) : (
        <div className="card divide-y divide-black/5">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm text-[var(--foreground)]">{log.description}</p>
                <p className="mt-0.5 text-xs text-black/40">
                  {log.user.name} ({log.user.role}) · {log.entityType} · {formatDateTime(log.createdAt)}
                </p>
              </div>
              <span className="badge shrink-0 bg-black/[0.05] text-black/50">{log.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
