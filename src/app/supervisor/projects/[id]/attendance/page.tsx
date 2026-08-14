import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedProjectOrRedirect } from "@/lib/supervisor-guard";
import { todayRangeUTC } from "@/lib/date-range";
import { formatINR, formatDate, titleCase } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { submitAttendance } from "./actions";

export default async function AttendancePage({ params }: PageProps<"/supervisor/projects/[id]/attendance">) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");
  const project = await getOwnedProjectOrRedirect(id, session.userId);

  const workers = await prisma.worker.findMany({
    where: { projectId: id, status: "ACTIVE" },
    orderBy: { name: "asc" },
  });

  const existing = await prisma.workerAttendance.findMany({
    where: { projectId: id, date: todayRangeUTC() },
  });
  const existingByWorker = new Map(existing.map((e) => [e.workerId, e]));

  const estimatedTotal = workers.reduce((sum, w) => {
    const e = existingByWorker.get(w.id);
    return sum + (e ? e.wageAmount : w.dailyWage);
  }, 0);

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Labour Attendance</h2>
        <p className="text-sm text-black/50">{project.name} · {formatDate(new Date())}</p>
      </div>

      {workers.length === 0 ? (
        <EmptyState icon={Users} title="No workers on this project" description="Workers are added by the admin from the office panel." />
      ) : (
        <form action={submitAttendance} className="space-y-3">
          <input type="hidden" name="projectId" value={id} />

          <div className="space-y-3">
            {workers.map((worker) => {
              const e = existingByWorker.get(worker.id);
              return (
                <div key={worker.id} className="card p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{worker.name}</p>
                      <p className="text-xs text-black/50">
                        {titleCase(worker.workerType)} · {formatINR(worker.dailyWage)}/day
                      </p>
                    </div>
                    {e && (
                      <span className="badge bg-[var(--status-info-bg)] text-[var(--status-info)]">Already marked</span>
                    )}
                  </div>
                  <select name={`status-${worker.id}`} defaultValue={e?.status ?? "PRESENT"} className="select">
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="OVERTIME">Overtime</option>
                  </select>
                  <input
                    type="number"
                    name={`overtime-${worker.id}`}
                    defaultValue={e?.overtimeHours || 2}
                    min={0}
                    step={0.5}
                    placeholder="Overtime hours (if Overtime selected)"
                    className="input mt-2"
                  />
                </div>
              );
            })}
          </div>

          <div className="card sticky bottom-20 z-10 flex items-center justify-between p-4 md:static">
            <div>
              <p className="text-xs text-black/50">Estimated total labour cost</p>
              <p className="text-lg font-bold text-brand-gold">{formatINR(estimatedTotal)}</p>
            </div>
            <button type="submit" className="btn-primary">Save Attendance</button>
          </div>
        </form>
      )}
    </div>
  );
}
