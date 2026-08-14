import { FileText, ExternalLink, ListChecks } from "lucide-react";
import { prisma } from "@/lib/db";
import { getClientContext } from "@/lib/client-data";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

export default async function ClientDocumentsPage() {
  const { project } = await getClientContext();

  if (!project) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No project assigned yet"
        description="Your project documents will show up here once available."
      />
    );
  }

  const documents = await prisma.projectDocument.findMany({
    where: { projectId: project.id, visibleToClient: true },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Documents</h2>
        <p className="text-sm text-black/50">{project.name}</p>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="No documents shared yet" description="Documents shared by the team will appear here." />
      ) : (
        <div className="card divide-y divide-black/5">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 transition hover:bg-black/[0.02]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{doc.name}</p>
                <p className="text-xs text-black/40">
                  {doc.type} · Uploaded {formatDate(doc.uploadedAt)}
                </p>
              </div>
              <ExternalLink size={16} className="shrink-0 text-black/30" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
