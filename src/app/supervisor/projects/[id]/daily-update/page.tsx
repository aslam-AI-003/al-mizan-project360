import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOwnedProjectOrRedirect } from "@/lib/supervisor-guard";
import { submitDailyUpdate } from "./actions";

const WORK_CATEGORIES = [
  "Structural Work",
  "Brickwork",
  "Electrical Work",
  "Plumbing Work",
  "Plastering",
  "Flooring",
  "Painting",
  "Finishing Work",
  "Site Preparation",
];

export default async function DailyUpdatePage({ params }: PageProps<"/supervisor/projects/[id]/daily-update">) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");
  const project = await getOwnedProjectOrRedirect(id, session.userId);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Daily Work Update</h2>
        <p className="text-sm text-black/50">{project.name}</p>
      </div>

      <form action={submitDailyUpdate} className="card space-y-3 p-4">
        <input type="hidden" name="projectId" value={id} />

        <div>
          <label className="label">Date</label>
          <input type="date" name="date" required className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>

        <div>
          <label className="label">Work Category</label>
          <select name="workCategory" required className="select" defaultValue={WORK_CATEGORIES[0]}>
            {WORK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Work Completed Today</label>
          <textarea name="workCompleted" rows={3} required className="textarea" placeholder="Describe the work completed..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Progress (%)</label>
            <input type="number" name="progressPercentage" min={0} max={100} required className="input" defaultValue={project.overallProgress} />
          </div>
          <div>
            <label className="label">Workers on Site</label>
            <input type="number" name="workersCount" min={0} required className="input" placeholder="e.g. 12" />
          </div>
        </div>

        <div>
          <label className="label">Materials Used</label>
          <textarea name="materialsUsed" rows={2} className="textarea" placeholder="e.g. Cement 25 bags, Steel 350 kg" />
        </div>

        <div>
          <label className="label">Issues Faced (optional)</label>
          <textarea name="issues" rows={2} className="textarea" placeholder="Any issues encountered today..." />
        </div>

        <div>
          <label className="label">Tomorrow&apos;s Plan</label>
          <textarea name="tomorrowPlan" rows={2} required className="textarea" placeholder="What's planned for tomorrow?" />
        </div>

        <div>
          <label className="label">Remarks (optional)</label>
          <textarea name="remarks" rows={2} className="textarea" placeholder="Any other remarks..." />
        </div>

        <button type="submit" className="btn-primary w-full">Submit Daily Report</button>
      </form>
    </div>
  );
}
