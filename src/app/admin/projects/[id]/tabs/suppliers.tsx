import Link from "next/link";
import { Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

/** What this project bought from each supplier. Payments are tracked per supplier on the Suppliers page. */
export async function SuppliersTab({ projectId }: { projectId: string }) {
  const rows = await prisma.purchase.groupBy({
    by: ["supplierId"],
    where: { projectId },
    _sum: { totalAmount: true },
    _count: true,
  });
  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: rows.map((r) => r.supplierId).filter((x): x is string => Boolean(x)) } },
  });
  const nameOf = new Map(suppliers.map((s) => [s.id, s.name]));

  if (rows.length === 0) {
    return <EmptyState icon={Truck} title="No supplier purchases yet" />;
  }

  const sorted = [...rows].sort((a, b) => (b._sum.totalAmount ?? 0) - (a._sum.totalAmount ?? 0));
  return (
    <div className="space-y-3">
      <div className="card divide-y divide-black/5">
        {sorted.map((r) => (
          <div key={r.supplierId ?? "none"} className="flex items-center justify-between gap-3 p-4 text-sm">
            <div>
              {r.supplierId ? (
                <Link href={`/admin/suppliers/${r.supplierId}`} className="font-semibold text-brand-navy">
                  {nameOf.get(r.supplierId) ?? "Unknown"}
                </Link>
              ) : (
                <p className="font-semibold text-black/50">No supplier given</p>
              )}
              <p className="text-xs text-black/40">{r._count} purchase(s)</p>
            </div>
            <p className="font-bold">{formatINR(r._sum.totalAmount ?? 0)}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-black/40">
        Paid and pending amounts are shown on the <Link href="/admin/suppliers" className="font-semibold text-brand-navy">Suppliers</Link> page.
      </p>
    </div>
  );
}
