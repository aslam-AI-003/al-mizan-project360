import type { Expense } from "@prisma/client";
import { formatDate, formatINR, titleCase } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { Receipt } from "lucide-react";

export function ExpensesTab({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return <EmptyState icon={Receipt} title="No site expenses yet" />;
  }
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between p-4">
        <p className="text-sm text-black/50">Total site expenses</p>
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
            <p className="text-sm font-bold text-[var(--foreground)]">{formatINR(e.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
