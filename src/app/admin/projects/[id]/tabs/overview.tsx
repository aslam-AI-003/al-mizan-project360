import type { Project } from "@prisma/client";
import type { SpendBreakdown } from "@/lib/project-costs";
import { formatINR } from "@/lib/format";
import { updateProject } from "../actions";

const STATUSES = ["PLANNING", "STARTED", "IN_PROGRESS", "ON_HOLD", "DELAYED", "COMPLETED"];

export function OverviewTab({ project, spend }: { project: Project; spend: SpendBreakdown }) {
  const toInputDate = (d: Date) => new Date(d).toISOString().slice(0, 10);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card space-y-4 p-5 md:col-span-2">
        <h3 className="text-sm font-bold text-[var(--foreground)]">Project Details</h3>
        <form action={updateProject} className="space-y-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Project Name</label>
              <input name="name" required defaultValue={project.name} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Site Address</label>
              <input name="siteAddress" required defaultValue={project.siteAddress} className="input" />
            </div>
            <div>
              <label className="label">Client Name</label>
              <input name="clientName" defaultValue={project.clientName} className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" defaultValue={project.status} className="select">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Budget (₹)</label>
              <input type="number" name="budget" min={0} required defaultValue={project.budget} className="input" />
            </div>
            <div>
              <label className="label">Contract Value (₹)</label>
              <input type="number" name="contractValue" min={0} defaultValue={project.contractValue} className="input" />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" name="startDate" required defaultValue={toInputDate(project.startDate)} className="input" />
            </div>
            <div>
              <label className="label">Expected Completion</label>
              <input type="date" name="expectedCompletionDate" required defaultValue={toInputDate(project.expectedCompletionDate)} className="input" />
            </div>
            <div>
              <label className="label">Work Progress (%)</label>
              <input type="number" name="overallProgress" min={0} max={100} defaultValue={project.overallProgress} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea name="description" rows={3} defaultValue={project.description ?? ""} className="textarea" />
            </div>
          </div>
          <button type="submit" className="btn-primary">Save Changes</button>
        </form>
      </div>

      <div className="card h-fit p-5">
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Spending So Far</h3>
        <div className="space-y-2.5 text-sm">
          <Row label="Labour" value={spend.labour} />
          <Row label="Material" value={spend.material} />
          <Row label="Other Expenses" value={spend.other} />
          <div className="h-px bg-black/5" />
          <Row label="Total Spent" value={spend.total} bold />
          <Row label="Budget" value={project.budget} />
          <Row label="Balance" value={project.budget - spend.total} tone={project.budget - spend.total < 0 ? "danger" : "success"} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: number; bold?: boolean; tone?: "success" | "danger" }) {
  const cls = tone === "danger" ? "font-bold text-[var(--status-danger)]" : tone === "success" ? "font-bold text-[var(--status-success)]" : bold ? "font-bold" : "font-medium";
  return (
    <div className="flex items-center justify-between">
      <span className="text-black/50">{label}</span>
      <span className={cls}>{formatINR(value)}</span>
    </div>
  );
}
