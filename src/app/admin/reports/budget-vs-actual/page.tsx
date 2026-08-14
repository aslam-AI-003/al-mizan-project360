import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

async function getBudgetVsActual() {
  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, budget: true },
  });

  return Promise.all(
    projects.map(async (project) => {
      const [expenses, workerPayments, purchases] = await Promise.all([
        prisma.expense.aggregate({ where: { projectId: project.id }, _sum: { amount: true } }),
        prisma.workerPayment.aggregate({ where: { projectId: project.id }, _sum: { amount: true } }),
        prisma.purchase.aggregate({ where: { projectId: project.id }, _sum: { totalAmount: true } }),
      ]);
      const actual =
        (expenses._sum.amount ?? 0) + (workerPayments._sum.amount ?? 0) + (purchases._sum.totalAmount ?? 0);
      return { ...project, actual, variance: project.budget - actual };
    })
  );
}

export default async function BudgetVsActualReportPage() {
  const rows = await getBudgetVsActual();
  const totalBudget = rows.reduce((sum, r) => sum + r.budget, 0);
  const totalActual = rows.reduce((sum, r) => sum + r.actual, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/reports" className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 hover:bg-black/[0.04]">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Budget vs Actual Report</h2>
            <p className="text-sm text-black/50">
              Budget {formatINR(totalBudget)} · Actual {formatINR(totalActual)}
            </p>
          </div>
        </div>
        <a href="/admin/reports/budget-vs-actual/download" className="btn-primary btn-sm shrink-0">
          <Download size={16} /> CSV
        </a>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs font-semibold text-black/50">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Actual Spend</th>
              <th className="px-4 py-3 text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{r.name}</td>
                <td className="px-4 py-3 text-right text-black/70">{formatINR(r.budget)}</td>
                <td className="px-4 py-3 text-right text-black/70">{formatINR(r.actual)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${r.variance < 0 ? "text-[var(--status-danger)]" : "text-[var(--status-success)]"}`}>
                  {formatINR(r.variance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-black/40">No projects on record.</p>}
      </div>
    </div>
  );
}
