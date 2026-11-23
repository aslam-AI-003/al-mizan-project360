import Link from "next/link";
import { Truck } from "lucide-react";
import { getSupplierBalances } from "@/lib/project-costs";
import { formatINR } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { addSupplier } from "./actions";
import { PaymentForm } from "./payment-form";

export default async function SuppliersPage() {
  const suppliers = await getSupplierBalances();
  const totals = suppliers.reduce(
    (t, s) => ({ bought: t.bought + s.bought, paid: t.paid + s.paid, pending: t.pending + Math.max(0, s.pending) }),
    { bought: 0, paid: 0, pending: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Suppliers</h2>
        <p className="text-sm text-black/50">What you bought, what you paid, and what is still pending.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-black/50">Total Bought</p>
          <p className="text-lg font-bold">{formatINR(totals.bought)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-black/50">Paid</p>
          <p className="text-lg font-bold text-[var(--status-success)]">{formatINR(totals.paid)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-black/50">Pending</p>
          <p className="text-lg font-bold text-[var(--status-warning)]">{formatINR(totals.pending)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {suppliers.length === 0 ? (
            <EmptyState icon={Truck} title="No suppliers yet" description="Suppliers are added automatically when you enter a material purchase." />
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-left text-xs text-black/40">
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3 text-right">Bought</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/admin/suppliers/${s.id}`} className="font-semibold text-brand-navy">{s.name}</Link>
                        {s.phone && <p className="text-xs text-black/40">{s.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-right text-black/70">{formatINR(s.bought)}</td>
                      <td className="px-4 py-3 text-right text-black/70">{formatINR(s.paid)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${s.pending > 0 ? "text-[var(--status-warning)]" : s.pending < 0 ? "text-[var(--status-info)]" : "text-[var(--status-success)]"}`}>
                        {s.pending < 0 ? `${formatINR(-s.pending)} advance` : formatINR(s.pending)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {suppliers.length > 0 && <PaymentForm suppliers={suppliers} />}
          <form action={addSupplier} className="card space-y-3 p-4">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Add Supplier</h3>
            <div>
              <label className="label">Name</label>
              <input name="name" required className="input" placeholder="e.g. ABC Traders" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" type="tel" className="input" placeholder="Optional" />
            </div>
            <button type="submit" className="btn-outline w-full">Add Supplier</button>
          </form>
        </div>
      </div>
    </div>
  );
}
