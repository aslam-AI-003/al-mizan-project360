import type { ProjectDocument } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { addDocument, toggleDocumentVisibility } from "../actions";
import { Eye, EyeOff, FileText } from "lucide-react";

export function DocumentsTab({ projectId, documents }: { projectId: string; documents: ProjectDocument[] }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="card flex items-center justify-between gap-3 p-4">
            <a href={doc.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{doc.name}</p>
                <p className="text-xs text-black/40">{doc.type} · {formatDate(doc.uploadedAt)}</p>
              </div>
            </a>
            <form action={toggleDocumentVisibility}>
              <input type="hidden" name="documentId" value={doc.id} />
              <input type="hidden" name="projectId" value={projectId} />
              <button
                type="submit"
                className={`badge ${doc.visibleToClient ? "bg-[var(--status-success-bg)] text-[var(--status-success)]" : "bg-[var(--status-neutral-bg)] text-[var(--status-neutral)]"}`}
                title="Toggle client visibility"
              >
                {doc.visibleToClient ? <Eye size={12} /> : <EyeOff size={12} />}
                {doc.visibleToClient ? "Visible to client" : "Hidden from client"}
              </button>
            </form>
          </div>
        ))}
        {documents.length === 0 && <p className="text-sm text-black/40">No documents uploaded yet.</p>}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Add Document</h3>
        <form action={addDocument} className="card grid gap-3 p-4 sm:grid-cols-2">
          <input type="hidden" name="projectId" value={projectId} />
          <div>
            <label className="label">Document Name</label>
            <input type="text" name="name" required className="input" />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="select">
              <option>Agreement</option>
              <option>Estimate</option>
              <option>Approved Plan</option>
              <option>Payment Receipt</option>
              <option>Progress Report</option>
              <option>Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Document URL (optional — placeholder used if blank)</label>
            <input type="text" name="url" placeholder="https://..." className="input" />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" id="visibleToClient" name="visibleToClient" className="h-4 w-4" />
            <label htmlFor="visibleToClient" className="text-sm text-black/60">Visible to client</label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Add Document</button>
          </div>
        </form>
      </div>
    </div>
  );
}
