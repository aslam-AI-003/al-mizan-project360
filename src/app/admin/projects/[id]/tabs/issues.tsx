import type { Issue, User } from "@prisma/client";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { AlertCircle } from "lucide-react";
import { resolveIssue } from "../actions";

type IssueWithRelations = Issue & { reportedBy: User; assignedTo: User | null };

export function IssuesTab({ projectId, issues }: { projectId: string; issues: IssueWithRelations[] }) {
  if (issues.length === 0) {
    return <EmptyState icon={AlertCircle} title="No issues reported" description="Site issues raised by supervisors will appear here." />;
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <div key={issue.id} className="card p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <StatusBadge status={issue.priority} />
                <StatusBadge status={issue.status} />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{issue.title}</p>
              <p className="text-xs text-black/40">
                Reported by {issue.reportedBy.name} · {formatDateTime(issue.createdAt)}
              </p>
            </div>
          </div>
          <p className="mb-2 text-sm text-black/60">{issue.description}</p>
          {issue.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={issue.photoUrl} alt={issue.title} className="mb-2 h-32 w-full max-w-xs rounded-lg object-cover" />
          )}
          {issue.status === "RESOLVED" ? (
            <p className="text-xs text-[var(--status-success)]">Resolved: {issue.resolution}</p>
          ) : (
            <form action={resolveIssue} className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="issueId" value={issue.id} />
              <input type="hidden" name="projectId" value={projectId} />
              <input type="text" name="resolution" placeholder="Resolution notes..." required className="input flex-1" />
              <button type="submit" className="btn-primary btn-sm whitespace-nowrap">Mark Resolved</button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
