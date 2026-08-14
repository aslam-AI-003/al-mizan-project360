import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { createProject } from "./actions";

const STATUS_OPTIONS = ["PLANNING", "STARTED", "IN_PROGRESS", "ON_HOLD", "DELAYED", "COMPLETED"];

export default async function NewProjectPage() {
  const [clients, supervisors] = await Promise.all([
    prisma.user.findMany({ where: { role: "CLIENT" }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "SUPERVISOR" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/projects"
          className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 hover:bg-black/[0.04]"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">New Project</h2>
          <p className="text-sm text-black/50">Set up a new construction project.</p>
        </div>
      </div>

      <form action={createProject} className="card space-y-5 p-5">
        <div>
          <label className="label" htmlFor="name">Project Name</label>
          <input id="name" name="name" type="text" required className="input" placeholder="e.g. Al-Mizan Residency Phase 2" />
        </div>

        <div>
          <label className="label" htmlFor="siteAddress">Site Address</label>
          <input id="siteAddress" name="siteAddress" type="text" required className="input" placeholder="Full site address" />
        </div>

        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} className="textarea" placeholder="Brief project description (optional)" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="clientId">Client</label>
            <select id="clientId" name="clientId" required className="select" defaultValue="">
              <option value="" disabled>Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            {clients.length === 0 && (
              <p className="mt-1 text-xs text-[var(--status-danger)]">No client accounts exist yet.</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="projectManager">Project Manager</label>
            <input
              id="projectManager"
              name="projectManager"
              type="text"
              className="input"
              defaultValue="Ibrahim Al-Mizan"
            />
          </div>
        </div>

        <div>
          <span className="label">Supervisor(s)</span>
          {supervisors.length === 0 ? (
            <p className="text-xs text-black/40">No supervisor accounts exist yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 rounded-xl border border-black/10 p-3 sm:grid-cols-2">
              {supervisors.map((supervisor) => (
                <label key={supervisor.id} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <input type="checkbox" name="supervisorIds" value={supervisor.id} className="h-4 w-4 rounded border-black/20" />
                  {supervisor.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="budget">Budget (INR)</label>
            <input id="budget" name="budget" type="number" min="0" step="1" required className="input" placeholder="0" />
          </div>
          <div>
            <label className="label" htmlFor="contractValue">Contract Value (INR)</label>
            <input id="contractValue" name="contractValue" type="number" min="0" step="1" required className="input" placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="startDate">Start Date</label>
            <input id="startDate" name="startDate" type="date" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="expectedCompletionDate">Expected Completion Date</label>
            <input id="expectedCompletionDate" name="expectedCompletionDate" type="date" required className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" className="select" defaultValue="PLANNING">
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">Create Project</button>
          <Link href="/admin/projects" className="btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
