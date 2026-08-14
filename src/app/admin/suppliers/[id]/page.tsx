import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatINR, formatDate, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default async function SupplierDetailPage(props: PageProps<"/admin/suppliers/[id]">) {
  const { id } = await props.params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      payments: { orderBy: { paymentDate: "desc" }, include: { project: { select: { name: true } } } },
      purchases: { orderBy: { createdAt: "desc" }, include: { project: { select: { name: true } }, material: { select: { name: true } } } },
    },
  });

  if (!supplier) notFound();

  const invoiced = supplier.payments.reduce((sum, p) => sum + p.invoiceAmount, 0);
  const paid = supplier.payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const outstanding = Math.max(0, invoiced - paid);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/suppliers"
          className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 hover:bg-black/[0.04]"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">{supplier.name}</h2>
          <p className="text-sm text-black/50">{supplier.shopName}</p>
        </div>
      </div>

      <div className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-xs text-black/50">Contact Person</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">{supplier.contactPerson}</p>
        </div>
        <div>
          <p className="text-xs text-black/50">Mobile</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">{supplier.mobile}</p>
        </div>
        <div>
          <p className="text-xs text-black/50">Address</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">{supplier.address}</p>
        </div>
        <div>
          <p className="text-xs text-black/50">Materials Supplied</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">{supplier.materialsSupplied}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-black/50">Total Invoiced</p>
          <p className="text-lg font-bold text-[var(--foreground)]">{formatINR(invoiced)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-black/50">Total Paid</p>
          <p className="text-lg font-bold text-[var(--status-success)]">{formatINR(paid)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-black/50">Outstanding</p>
          <p className={`text-lg font-bold ${outstanding > 0 ? "text-[var(--status-danger)]" : "text-[var(--foreground)]"}`}>
            {formatINR(outstanding)}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Payment History</h3>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs font-semibold text-black/50">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Invoiced</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {supplier.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 font-mono text-xs text-black/60">{payment.invoiceNumber}</td>
                  <td className="px-4 py-3 text-black/70">{payment.project.name}</td>
                  <td className="px-4 py-3 text-black/70">{formatDate(payment.paymentDate)}</td>
                  <td className="px-4 py-3 text-right text-black/70">{formatINR(payment.invoiceAmount)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-navy">{formatINR(payment.paidAmount)}</td>
                  <td className="px-4 py-3 text-black/70">{titleCase(payment.paymentMode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {supplier.payments.length === 0 && <p className="p-4 text-sm text-black/40">No payments recorded yet.</p>}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Purchase History</h3>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs font-semibold text-black/50">
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {supplier.purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{purchase.material.name}</td>
                  <td className="px-4 py-3 text-black/70">{purchase.project.name}</td>
                  <td className="px-4 py-3 text-black/70">{purchase.quantity} {purchase.unit}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-navy">{formatINR(purchase.totalAmount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={purchase.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {supplier.purchases.length === 0 && <p className="p-4 text-sm text-black/40">No purchases recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
