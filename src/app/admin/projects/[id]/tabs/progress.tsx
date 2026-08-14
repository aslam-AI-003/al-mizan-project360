import type { ProgressStage } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { updateProgressStage } from "../actions";

export function ProgressTab({ projectId, stages }: { projectId: string; stages: ProgressStage[] }) {
  const toInputDate = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <details key={stage.id} className="card group p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-black/40">#{stage.order}</span>
                <p className="text-sm font-semibold text-[var(--foreground)]">{stage.name}</p>
                <StatusBadge status={stage.status} />
              </div>
              <ProgressBar value={stage.progressPercentage} />
              <p className="mt-1 text-xs text-black/40">
                Planned: {formatDate(stage.plannedStart)} – {formatDate(stage.plannedEnd)}
                {stage.actualStart && <> · Actual: {formatDate(stage.actualStart)}{stage.actualEnd ? ` – ${formatDate(stage.actualEnd)}` : " (ongoing)"}</>}
              </p>
            </div>
            <span className="text-xs font-semibold text-brand-navy">{stage.progressPercentage}%</span>
          </summary>

          <form action={updateProgressStage} className="mt-4 grid gap-3 border-t border-black/5 pt-4 sm:grid-cols-2">
            <input type="hidden" name="stageId" value={stage.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <div>
              <label className="label">Status</label>
              <select name="status" defaultValue={stage.status} className="select">
                {["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DELAYED"].map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Progress (%)</label>
              <input type="number" name="progressPercentage" min={0} max={100} defaultValue={stage.progressPercentage} className="input" />
            </div>
            <div>
              <label className="label">Actual Start</label>
              <input type="date" name="actualStart" defaultValue={toInputDate(stage.actualStart)} className="input" />
            </div>
            <div>
              <label className="label">Actual Completion</label>
              <input type="date" name="actualEnd" defaultValue={toInputDate(stage.actualEnd)} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Remarks</label>
              <textarea name="remarks" rows={2} defaultValue={stage.remarks ?? ""} className="textarea" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary btn-sm">Update Stage</button>
            </div>
          </form>
        </details>
      ))}
    </div>
  );
}
