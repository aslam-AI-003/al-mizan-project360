import type { Purchase, Material, User } from "@prisma/client";
import { formatDate, formatINR } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { ShoppingCart } from "lucide-react";

type PurchaseWithRelations = Purchase & { material: Material; createdBy: User };

export function PurchasesTab({ purchases }: { purchases: PurchaseWithRelations[] }) {
  if (purchases.length === 0) {
    return <EmptyState icon={ShoppingCart} title="No material purchases yet" description="Materials bought by the supervisor will appear here." />;
  }
  const total = purchases.reduce((s, p) => s + p.totalAmount, 0);

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between p-4">
        <p className="text-sm text-black/50">Total material cost</p>
        <p className="text-lg font-bold text-[var(--foreground)]">{formatINR(total)}</p>
      </div>
      <div className="space-y-3">
        {purchases.map((p) => (
          <div key={p.id} className="card flex items-start justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {p.quantity} {p.unit} of {p.material.name}
                {p.vendorName && <span className="font-normal text-black/50"> — {p.vendorName}</span>}
              </p>
              <p className="text-xs text-black/40">
                {formatDate(p.date)} · {p.quantity} × {formatINR(p.rate)} · by {p.createdBy.name}
              </p>
              {p.remarks && <p className="mt-1 text-xs text-black/50">{p.remarks}</p>}
            </div>
            <p className="text-sm font-bold text-[var(--foreground)]">{formatINR(p.totalAmount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
