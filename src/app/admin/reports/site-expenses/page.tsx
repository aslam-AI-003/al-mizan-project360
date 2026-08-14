import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, formatINR, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

function buildQuery(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const key of ["project", "from", "to"]) {
    const value = searchParams[key];
    if (typeof value === "string" && value) params.set(key, value);
  }
  return params.toString();
}

export default async function SiteExpensesReportPage(props: PageProps<"/admin/reports/site-expenses">) {
  const searchParams = await props.searchParams;
  const projectId = typeof searchParams.project === "string" ? searchParams.project : "";
  const from = typeof searchParams.from === "string" ? searchParams.from : "";
  const to = typeof searchParams.to === "string" ? searchParams.to : "";

  const [projects, expenses] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.expense.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: { project: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
  ]);

  const query = buildQuery(searchParams);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/reports" className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 hover:bg-black/[0.04]">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Site Expenses Report</h2>
          <p className="text-sm text-black/50">{expenses.length} record(s) · Total {formatINR(total)}</p>
        </div>
      </div>

      <form method="GET" className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="project">Project</label>
          <select id="project" name="project" defaultValue={projectId} className="select">
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={from} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={to} className="input" />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-outline flex-1">Apply</button>
          <a href={`/admin/reports/site-expenses/download${query ? `?${query}` : ""}`} className="btn-primary shrink-0">
            <Download size={16} />
          </a>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs font-semibold text-black/50">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Paid By</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-black/70">{formatDate(e.date)}</td>
                <td className="px-4 py-3 text-black/70">{e.project.name}</td>
                <td className="px-4 py-3 text-black/70">{titleCase(e.category)}</td>
                <td className="px-4 py-3 text-black/70">{e.description}</td>
                <td className="px-4 py-3 text-black/70">{e.paidBy}</td>
                <td className="px-4 py-3 text-right font-semibold text-brand-navy">{formatINR(e.amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <p className="p-4 text-sm text-black/40">No expenses match these filters.</p>}
      </div>
    </div>
  );
}
