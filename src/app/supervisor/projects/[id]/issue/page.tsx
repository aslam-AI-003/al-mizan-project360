import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOwnedProjectOrRedirect } from "@/lib/supervisor-guard";
import { reportIssue } from "./actions";

export default async function IssuePage({ params }: PageProps<"/supervisor/projects/[id]/issue">) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");
  const project = await getOwnedProjectOrRedirect(id, session.userId);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Report an Issue</h2>
        <p className="text-sm text-black/50">{project.name}</p>
      </div>

      <form action={reportIssue} className="card space-y-3 p-4">
        <input type="hidden" name="projectId" value={id} />

        <div>
          <label className="label">Title</label>
          <input type="text" name="title" required className="input" placeholder="e.g. Water seepage near bathroom wall" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={4} required className="textarea" placeholder="Describe the issue in detail..." />
        </div>

        <div>
          <label className="label">Priority</label>
          <select name="priority" required className="select" defaultValue="MEDIUM">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div>
          <label className="label">Photo URL (optional)</label>
          <input type="url" name="photoUrl" className="input" placeholder="https://..." />
        </div>

        <button type="submit" className="btn-danger w-full">Report Issue</button>
      </form>
    </div>
  );
}
