import { formatDate, formatINR } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { updateProject } from "../actions";
import type { Prisma } from "@prisma/client";

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: { client: true; supervisors: { include: { supervisor: true } } };
}>;

export function OverviewTab({
  project,
  boqCount,
  openIssueCount,
}: {
  project: ProjectWithRelations;
  boqCount: number;
  openIssueCount: number;
}) {
  const toInputDate = (d: Date) => new Date(d).toISOString().slice(0, 10);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card space-y-4 p-5 md:col-span-2">
        <h3 className="text-sm font-bold text-[var(--foreground)]">Project Details</h3>
        <form action={updateProject} className="space-y-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Status</label>
              <select name="status" defaultValue={project.status} className="select">
                {["PLANNING", "STARTED", "IN_PROGRESS", "ON_HOLD", "DELAYED", "COMPLETED"].map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Overall Progress (%)</label>
              <input type="number" name="overallProgress" min={0} max={100} defaultValue={project.overallProgress} className="input" />
            </div>
            <div>
              <label className="label">Budget (₹)</label>
              <input type="number" name="budget" defaultValue={project.budget} className="input" />
            </div>
            <div>
              <label className="label">Contract Value (₹)</label>
              <input type="number" name="contractValue" defaultValue={project.contractValue} className="input" />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" name="startDate" defaultValue={toInputDate(project.startDate)} className="input" />
            </div>
            <div>
              <label className="label">Expected Completion</label>
              <input type="date" name="expectedCompletionDate" defaultValue={toInputDate(project.expectedCompletionDate)} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Project Manager</label>
              <input type="text" name="projectManager" defaultValue={project.projectManager ?? ""} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" rows={3} defaultValue={project.description ?? ""} className="textarea" />
            </div>
          </div>
          <button type="submit" className="btn-primary">Save Changes</button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">At a Glance</h3>
          <div className="space-y-3 text-sm">
            <Row label="Status"><StatusBadge status={project.status} /></Row>
            <Row label="Client">{project.client.name}</Row>
            <Row label="Supervisor(s)">{project.supervisors.map((s) => s.supervisor.name).join(", ") || "—"}</Row>
            <Row label="Site Address">{project.siteAddress}</Row>
            <Row label="Start Date">{formatDate(project.startDate)}</Row>
            <Row label="Expected Completion">{formatDate(project.expectedCompletionDate)}</Row>
            <Row label="Contract Value">{formatINR(project.contractValue)}</Row>
            <Row label="Budget">{formatINR(project.budget)}</Row>
            <Row label="Open BOQ Items">{boqCount}</Row>
            <Row label="Open Issues">{openIssueCount}</Row>
          </div>
          <div className="mt-4">
            <p className="mb-1 text-xs text-black/50">Overall Progress</p>
            <ProgressBar value={project.overallProgress} />
            <p className="mt-1 text-right text-xs font-semibold text-black/60">{project.overallProgress}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-black/50">{label}</span>
      <span className="text-right font-medium text-[var(--foreground)]">{children}</span>
    </div>
  );
}
