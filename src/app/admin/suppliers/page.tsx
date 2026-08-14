import Link from "next/link";
import { Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { createSupplier } from "./actions";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { payments: { select: { invoiceAmount: true, paidAmount: true } } },
  });

  const rows = suppliers.map((supplier) => {
    const invoiced = supplier.payments.reduce((sum, p) => sum + p.invoiceAmount, 0);
    const paid = supplier.payments.reduce((sum, p) => sum + p.paidAmount, 0);
    return { ...supplier, outstanding: Math.max(0, invoiced - paid) };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Supplier Master</h2>
        <p className="text-sm text-black/50">{suppliers.length} supplier(s) on record.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Truck} title="No suppliers yet" description="Add a supplier below to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((supplier) => (
            <Link key={supplier.id} href={`/admin/suppliers/${supplier.id}`} className="card block p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--foreground)]">{supplier.name}</p>
                  <p className="truncate text-xs text-black/50">{supplier.shopName}</p>
                </div>
                {supplier.outstanding > 0 && (
                  <span className="badge shrink-0 bg-[var(--status-danger-bg)] text-[var(--status-danger)]">
                    {formatINR(supplier.outstanding)} due
                  </span>
                )}
              </div>
              <p className="text-xs text-black/50">Contact: {supplier.contactPerson} · {supplier.mobile}</p>
              <p className="truncate text-xs text-black/50">{supplier.address}</p>
              <p className="mt-2 truncate text-xs font-medium text-black/60">Supplies: {supplier.materialsSupplied}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="card p-5">
        <h3 className="mb-4 text-sm font-bold text-[var(--foreground)]">Add Supplier</h3>
        <form action={createSupplier} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-name">Name</label>
            <input id="s-name" name="name" type="text" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="s-shop">Shop Name</label>
            <input id="s-shop" name="shopName" type="text" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="s-contact">Contact Person</label>
            <input id="s-contact" name="contactPerson" type="text" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="s-mobile">Mobile</label>
            <input id="s-mobile" name="mobile" type="tel" required className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="s-address">Address</label>
            <input id="s-address" name="address" type="text" required className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="s-materials">Materials Supplied</label>
            <input id="s-materials" name="materialsSupplied" type="text" required className="input" placeholder="e.g. Cement, Steel, Sand" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Add Supplier</button>
          </div>
        </form>
      </div>
    </div>
  );
}
