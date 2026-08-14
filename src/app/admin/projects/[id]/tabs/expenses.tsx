import Link from "next/link";
import type { Expense } from "@prisma/client";
import { formatDate, formatINR, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Receipt } from "lucide-react";

export function ExpensesTab({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return <EmptyState icon={Receipt} title="No site expenses yet" />;
  }

  const total = expenses.filter((e) => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between p-4">
        <p className="text-sm text-black/50">Total approved expenses</p>
        <p className="text-lg font-bold text-[var(--foreground)]">{formatINR(total)}</p>
      </div>
      <div className="space-y-3">
        {expenses.map((e) => (
          <div key={e.id} className="card flex items-start justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{titleCase(e.category)}</p>
              <p className="text-xs text-black/40">{formatDate(e.date)} · Paid by {e.paidBy} · {titleCase(e.paymentMode)}</p>
              <p className="mt-1 text-xs text-black/50">{e.description}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <p className="text-sm font-bold text-[var(--foreground)]">{formatINR(e.amount)}</p>
              <StatusBadge status={e.status} />
              {e.status === "SUBMITTED" && (
                <Link href="/admin/approvals" className="text-xs font-semibold text-brand-navy underline">Review</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
