import Link from "next/link";
import type { DailyReport, ProjectPhoto, User } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ClipboardList } from "lucide-react";

type ReportWithRelations = DailyReport & { photos: ProjectPhoto[]; createdBy: User };

export function DailyUpdatesTab({ reports }: { reports: ReportWithRelations[] }) {
  if (reports.length === 0) {
    return <EmptyState icon={ClipboardList} title="No daily reports yet" description="Supervisor updates will appear here." />;
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="card p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">{formatDate(report.date)}</p>
              <p className="text-xs text-black/40">{report.workCategory} · by {report.createdBy.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={report.status} />
              {report.status === "SUBMITTED" && (
                <Link href="/admin/approvals" className="text-xs font-semibold text-brand-navy underline">
                  Review
                </Link>
              )}
            </div>
          </div>
          <p className="mb-2 text-sm text-[var(--foreground)]">{report.workCompleted}</p>
          <div className="mb-2 flex flex-wrap gap-3 text-xs text-black/50">
            <span>{report.progressPercentage}% progress</span>
            <span>{report.workersCount} workers</span>
          </div>
          {report.tomorrowPlan && <p className="mb-2 text-xs text-black/50">Tomorrow: {report.tomorrowPlan}</p>}
          {report.issues && <p className="mb-2 text-xs text-[var(--status-danger)]">Issue: {report.issues}</p>}
          {report.photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {report.photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={photo.id} src={photo.url} alt={photo.caption} className="aspect-square w-full rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
