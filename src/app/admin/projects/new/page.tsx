import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createProject } from "./actions";

const STATUS_OPTIONS = ["PLANNING", "STARTED", "IN_PROGRESS", "ON_HOLD", "DELAYED", "COMPLETED"];

export default function NewProjectPage() {

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
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
            <label className="label" htmlFor="clientName">Client Name</label>
            <input id="clientName" name="clientName" type="text" required className="input" placeholder="e.g. Rajesh Kumar" />
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
          <Link href="/admin" className="btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
