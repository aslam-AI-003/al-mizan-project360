import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ClipboardCheck } from "lucide-react";
import { decideApproval } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  DAILY_REPORT: "Daily Report",
  PURCHASE: "Purchase Request",
  EXPENSE: "Expense",
  LABOUR_ADVANCE: "Labour Advance",
  SUPPLIER_PAYMENT: "Supplier Payment",
};

export default async function ApprovalsPage() {
  const [pending, history] = await Promise.all([
    prisma.approval.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    prisma.approval.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { actedAt: "desc" },
      take: 12,
      include: { actedBy: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Approval Centre</h2>
        <p className="text-sm text-black/50">{pending.length} item(s) awaiting your decision.</p>
      </div>

      {pending.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="All caught up" description="No pending approvals right now." />
      ) : (
        <div className="space-y-3">
          {pending.map((approval) => (
            <div key={approval.id} className="card p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <span className="badge bg-[var(--status-info-bg)] text-[var(--status-info)]">
                    {TYPE_LABEL[approval.type]}
                  </span>
                  <p className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">{approval.refLabel}</p>
                  <p className="text-xs text-black/40">Submitted {formatDateTime(approval.createdAt)}</p>
                </div>
              </div>
              <form action={decideApproval} className="space-y-2">
                <input type="hidden" name="approvalId" value={approval.id} />
                <textarea
                  name="comment"
                  rows={2}
                  placeholder="Add a comment (optional)"
                  className="textarea text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" name="decision" value="APPROVED" className="btn-primary btn-sm">
                    Approve
                  </button>
                  <button type="submit" name="decision" value="SENT_BACK" className="btn-outline btn-sm">
                    Send Back
                  </button>
                  <button type="submit" name="decision" value="REJECTED" className="btn-danger btn-sm">
                    Reject
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Approval History</h3>
        <div className="card divide-y divide-black/5">
          {history.map((approval) => (
            <div key={approval.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">{approval.refLabel}</p>
                <p className="text-xs text-black/40">
                  {approval.actedBy?.name ?? "System"} · {approval.actedAt ? formatDateTime(approval.actedAt) : ""}
                  {approval.comment ? ` · "${approval.comment}"` : ""}
                </p>
              </div>
              <StatusBadge status={approval.status} />
            </div>
          ))}
          {history.length === 0 && <p className="p-4 text-sm text-black/40">No decisions recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
