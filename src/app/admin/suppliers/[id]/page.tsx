import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, formatINR, titleCase } from "@/lib/format";
import { deleteSupplierPayment, updateSupplier } from "../actions";
import { PaymentForm } from "../payment-form";

export default async function SupplierDetailPage(props: PageProps<"/admin/suppliers/[id]">) {
  const { id } = await props.params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchases: { orderBy: { date: "desc" }, include: { material: true, project: { select: { id: true, name: true } } } },
      payments: { orderBy: { date: "desc" } },
    },
  });
  if (!supplier) notFound();

  const bought = supplier.purchases.reduce((s, p) => s + p.totalAmount, 0);
  const paid = supplier.payments.reduce((s, p) => s + p.amount, 0);
  const pending = bought - paid;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/suppliers" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-black/50 hover:text-black/70">
          <ArrowLeft size={14} /> All Suppliers
        </Link>
        <h2 className="text-lg font-bold text-[var(--foreground)]">{supplier.name}</h2>
        {supplier.phone && <p className="text-sm text-black/50">{supplier.phone}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 sm:p-4">
          <p className="text-xs text-black/50">Bought</p>
          <p className="text-base font-bold sm:text-lg">{formatINR(bought)}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-xs text-black/50">Paid</p>
          <p className="text-base font-bold sm:text-lg text-[var(--status-success)]">{formatINR(paid)}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-xs text-black/50">{pending < 0 ? "Advance" : "Pending"}</p>
          <p className={`text-lg font-bold ${pending > 0 ? "text-[var(--status-warning)]" : "text-[var(--status-success)]"}`}>{formatINR(Math.abs(pending))}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <h3 className="mb-3 text-sm font-bold">Purchases</h3>
            <div className="card divide-y divide-black/5">
              {supplier.purchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                  <div>
                    <p className="font-medium">{p.quantity.toLocaleString("en-IN")} {p.unit} {p.material.name} × {formatINR(p.rate)}</p>
                    <p className="text-xs text-black/40">
                      {formatDate(p.date)} ·{" "}
                      <Link href={`/admin/projects/${p.project.id}`} className="text-brand-navy">{p.project.name}</Link>
                    </p>
                  </div>
                  <p className="font-semibold">{formatINR(p.totalAmount)}</p>
                </div>
              ))}
              {supplier.purchases.length === 0 && <p className="p-4 text-sm text-black/40">No purchases yet.</p>}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold">Payments</h3>
            <div className="card divide-y divide-black/5">
              {supplier.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                  <div>
                    <p className="font-medium">{formatINR(p.amount)}</p>
                    <p className="text-xs text-black/40">{formatDate(p.date)} · {titleCase(p.mode)}{p.note ? ` · ${p.note}` : ""}</p>
                  </div>
                  <form action={deleteSupplierPayment}>
                    <input type="hidden" name="paymentId" value={p.id} />
                    <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-lg text-black/30 hover:bg-red-50 hover:text-red-600" title="Delete payment">
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              ))}
              {supplier.payments.length === 0 && <p className="p-4 text-sm text-black/40">No payments yet.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <PaymentForm supplierId={supplier.id} />
          <form action={updateSupplier} className="card space-y-3 p-4">
            <h3 className="text-sm font-bold">Edit Supplier</h3>
            <input type="hidden" name="supplierId" value={supplier.id} />
            <div>
              <label className="label">Name</label>
              <input name="name" required defaultValue={supplier.name} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" type="tel" defaultValue={supplier.phone ?? ""} className="input" />
            </div>
            <button type="submit" className="btn-outline w-full">Save</button>
          </form>
        </div>
      </div>
    </div>
  );
}
