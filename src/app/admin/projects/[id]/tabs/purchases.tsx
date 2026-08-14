import Link from "next/link";
import type { Purchase, Supplier, Material, User } from "@prisma/client";
import { formatDate, formatINR } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ShoppingCart } from "lucide-react";

type PurchaseWithRelations = Purchase & { supplier: Supplier; material: Material; requestedBy: User };

export function PurchasesTab({ purchases }: { purchases: PurchaseWithRelations[] }) {
  if (purchases.length === 0) {
    return <EmptyState icon={ShoppingCart} title="No purchase requests yet" />;
  }

  return (
    <div className="space-y-3">
      {purchases.map((p) => (
        <div key={p.id} className="card flex items-start justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {p.quantity} {p.unit} of {p.material.name} — {p.supplier.name}
            </p>
            <p className="text-xs text-black/40">
              Requested by {p.requestedBy.name} on {formatDate(p.createdAt)} · Required by {formatDate(p.requiredDate)}
            </p>
            {p.remarks && <p className="mt-1 text-xs text-black/50">{p.remarks}</p>}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <p className="text-sm font-bold text-[var(--foreground)]">{formatINR(p.totalAmount)}</p>
            <StatusBadge status={p.status} />
            {p.status === "SUBMITTED" && (
              <Link href="/admin/approvals" className="text-xs font-semibold text-brand-navy underline">Review</Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
