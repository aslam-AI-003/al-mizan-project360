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

export default async function LabourAttendanceReportPage(props: PageProps<"/admin/reports/labour-attendance">) {
  const searchParams = await props.searchParams;
  const projectId = typeof searchParams.project === "string" ? searchParams.project : "";
  const from = typeof searchParams.from === "string" ? searchParams.from : "";
  const to = typeof searchParams.to === "string" ? searchParams.to : "";

  const [projects, attendance] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.workerAttendance.findMany({
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
      include: { worker: { select: { name: true, workerCode: true } }, project: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
  ]);

  const query = buildQuery(searchParams);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/reports" className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 hover:bg-black/[0.04]">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Labour Attendance Report</h2>
          <p className="text-sm text-black/50">Showing {attendance.length} record(s) (max 200 preview rows).</p>
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
          <a href={`/admin/reports/labour-attendance/download${query ? `?${query}` : ""}`} className="btn-primary shrink-0">
            <Download size={16} />
          </a>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs font-semibold text-black/50">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Worker</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">OT Hours</th>
              <th className="px-4 py-3 text-right">Wage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {attendance.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-black/70">{formatDate(row.date)}</td>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">{row.worker.name} ({row.worker.workerCode})</td>
                <td className="px-4 py-3 text-black/70">{row.project.name}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} label={titleCase(row.status)} /></td>
                <td className="px-4 py-3 text-right text-black/70">{row.overtimeHours}</td>
                <td className="px-4 py-3 text-right font-semibold text-brand-navy">{formatINR(row.wageAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendance.length === 0 && <p className="p-4 text-sm text-black/40">No attendance records match these filters.</p>}
      </div>
    </div>
  );
}
