import Link from "next/link";
import { Building2, CheckCircle2, AlertTriangle, Users, HardHat } from "lucide-react";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { formatINR } from "@/lib/format";

type ProjectRow = Awaited<ReturnType<typeof getAdminDashboardData>>["ongoingProjects"][number];

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Business Overview</h2>
        <p className="text-sm text-black/50">Real-time snapshot across all sites.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total Projects" value={String(data.totalProjects)} icon={Building2} tone="navy" />
        <StatTile label="Ongoing" value={String(data.ongoingCount)} icon={HardHat} tone="info" />
        <StatTile label="Completed" value={String(data.completedCount)} icon={CheckCircle2} tone="success" />
        <StatTile label="Delayed" value={String(data.delayedCount)} icon={AlertTriangle} tone="danger" />
        <StatTile label="Supervisors" value={String(data.activeSupervisors)} icon={HardHat} tone="gold" />
        <StatTile label="Today's Labour" value={String(data.todaysLabourCount)} sublabel="workers on site" icon={Users} tone="info" />
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Today&apos;s Spending (all sites)</h3>
          <span className="text-xs text-black/40">
            {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryRow label="Labour" value={data.todaysLabourCost} />
          <SummaryRow label="Material" value={data.todaysMaterialCost} />
          <SummaryRow label="Other Expenses" value={data.todaysOtherExpenses} />
          <SummaryRow label="Total" value={data.todaysTotalSpending} emphasize />
        </div>
      </div>

      <ProjectBudgetTable title="Ongoing Projects" rows={data.ongoingProjects} empty="No ongoing projects." />
      <ProjectBudgetTable title="Completed Projects" rows={data.completedProjects} empty="No completed projects yet." />
    </div>
  );
}

function ProjectBudgetTable({ title, rows, empty }: { title: string; rows: ProjectRow[]; empty: string }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">
        {title} <span className="font-normal text-black/40">({rows.length})</span>
      </h3>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs font-semibold text-black/50">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Spent</th>
              <th className="px-4 py-3 text-right">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((p) => (
              <tr key={p.id} className="transition hover:bg-black/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin/projects/${p.id}?tab=ledger`} className="block">
                    <p className="font-semibold text-[var(--foreground)]">{p.name}</p>
                    <p className="text-xs text-black/50">{p.siteAddress}</p>
                  </Link>
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={p.overallProgress} className="w-20" />
                    <span className="text-xs font-semibold text-black/60">{p.overallProgress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-black/70">{formatINR(p.budget)}</td>
                <td className="px-4 py-3 text-right text-black/70">{formatINR(p.spent)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${p.remaining < 0 ? "text-[var(--status-danger)]" : "text-[var(--status-success)]"}`}>
                  {formatINR(p.remaining)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-black/40">{empty}</p>}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div>
      <p className="text-xs text-black/50">{label}</p>
      <p className={emphasize ? "text-lg font-bold text-brand-gold" : "text-base font-semibold text-[var(--foreground)]"}>
        {formatINR(value)}
      </p>
    </div>
  );
}
