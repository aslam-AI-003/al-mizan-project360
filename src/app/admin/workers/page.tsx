import { Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { WorkerType, WorkerStatus } from "@prisma/client";
import { formatINR, formatDate, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { createWorker, toggleWorkerStatus } from "./actions";

const WORKER_TYPES = ["MASON", "HELPER", "CARPENTER", "ELECTRICIAN", "PLUMBER", "PAINTER", "WELDER", "OTHER"];

export default async function WorkersPage(props: PageProps<"/admin/workers">) {
  const searchParams = await props.searchParams;
  const projectFilter = typeof searchParams.project === "string" ? searchParams.project : "";
  const typeFilter = typeof searchParams.type === "string" ? searchParams.type : "";
  const statusFilter = typeof searchParams.status === "string" ? searchParams.status : "";

  const [workers, projects] = await Promise.all([
    prisma.worker.findMany({
      where: {
        ...(projectFilter ? { projectId: projectFilter } : {}),
        ...(typeFilter && (WORKER_TYPES as readonly string[]).includes(typeFilter)
          ? { workerType: typeFilter as WorkerType }
          : {}),
        ...(statusFilter === "ACTIVE" || statusFilter === "INACTIVE"
          ? { status: statusFilter as WorkerStatus }
          : {}),
      },
      orderBy: { workerCode: "asc" },
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.project.findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Worker Master</h2>
        <p className="text-sm text-black/50">{workers.length} worker(s) matching current filters.</p>
      </div>

      <form method="GET" className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
        <div>
          <label className="label" htmlFor="project">Project</label>
          <select id="project" name="project" defaultValue={projectFilter} className="select">
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="type">Worker Type</label>
          <select id="type" name="type" defaultValue={typeFilter} className="select">
            <option value="">All Types</option>
            {WORKER_TYPES.map((t) => (
              <option key={t} value={t}>{titleCase(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={statusFilter} className="select">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-outline w-full">Apply Filters</button>
        </div>
      </form>

      {workers.length === 0 ? (
        <EmptyState icon={Users} title="No workers found" description="Try adjusting filters or add a new worker below." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs font-semibold text-black/50">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Daily Wage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {workers.map((worker) => (
                <tr key={worker.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-black/60">{worker.workerCode}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{worker.name}</td>
                  <td className="px-4 py-3 text-black/70">{worker.mobile}</td>
                  <td className="px-4 py-3 text-black/70">{titleCase(worker.workerType)}</td>
                  <td className="px-4 py-3 text-black/70">{worker.project.name}</td>
                  <td className="px-4 py-3 text-black/70">{formatDate(worker.joiningDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-navy">{formatINR(worker.dailyWage)}</td>
                  <td className="px-4 py-3"><StatusBadge status={worker.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleWorkerStatus}>
                      <input type="hidden" name="workerId" value={worker.id} />
                      <button type="submit" className="btn-outline btn-sm">
                        {worker.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-5">
        <h3 className="mb-4 text-sm font-bold text-[var(--foreground)]">Add Worker</h3>
        <form action={createWorker} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="label" htmlFor="w-name">Name</label>
            <input id="w-name" name="name" type="text" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="w-mobile">Mobile</label>
            <input id="w-mobile" name="mobile" type="tel" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="w-type">Worker Type</label>
            <select id="w-type" name="workerType" required className="select" defaultValue="MASON">
              {WORKER_TYPES.map((t) => (
                <option key={t} value={t}>{titleCase(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="w-wage">Daily Wage (INR)</label>
            <input id="w-wage" name="dailyWage" type="number" min="0" step="1" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="w-joining">Joining Date</label>
            <input id="w-joining" name="joiningDate" type="date" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="w-project">Project</label>
            <select id="w-project" name="projectId" required className="select" defaultValue="">
              <option value="" disabled>Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 md:col-span-3">
            <button type="submit" className="btn-primary">Add Worker</button>
          </div>
        </form>
      </div>
    </div>
  );
}
