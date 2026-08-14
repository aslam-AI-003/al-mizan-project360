import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export default async function SupplierOutstandingReportPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { payments: { select: { invoiceAmount: true, paidAmount: true } } },
  });

  const rows = suppliers.map((s) => {
    const invoiced = s.payments.reduce((sum, p) => sum + p.invoiceAmount, 0);
    const paid = s.payments.reduce((sum, p) => sum + p.paidAmount, 0);
    return { ...s, invoiced, paid, outstanding: Math.max(0, invoiced - paid) };
  });

  const totalOutstanding = rows.reduce((sum, r) => sum + r.outstanding, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/reports" className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 hover:bg-black/[0.04]">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Supplier Outstanding Report</h2>
            <p className="text-sm text-black/50">{rows.length} supplier(s) · Total outstanding {formatINR(totalOutstanding)}</p>
          </div>
        </div>
        <a href="/admin/reports/supplier-outstanding/download" className="btn-primary btn-sm shrink-0">
          <Download size={16} /> CSV
        </a>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs font-semibold text-black/50">
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3 text-right">Invoiced</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{s.name} <span className="text-black/40">({s.shopName})</span></td>
                <td className="px-4 py-3 text-black/70">{s.contactPerson}</td>
                <td className="px-4 py-3 text-black/70">{s.mobile}</td>
                <td className="px-4 py-3 text-right text-black/70">{formatINR(s.invoiced)}</td>
                <td className="px-4 py-3 text-right text-black/70">{formatINR(s.paid)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${s.outstanding > 0 ? "text-[var(--status-danger)]" : "text-[var(--foreground)]"}`}>
                  {formatINR(s.outstanding)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-black/40">No suppliers on record.</p>}
      </div>
    </div>
  );
}
