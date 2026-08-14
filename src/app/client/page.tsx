import { MapPin, Camera, Users, ImageOff, ListChecks } from "lucide-react";
import { prisma } from "@/lib/db";
import { getClientContext } from "@/lib/client-data";
import { formatDate } from "@/lib/format";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

export default async function ClientHomePage() {
  const { project } = await getClientContext();

  if (!project) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No project assigned yet"
        description="Once your project is set up, its progress will show up here."
      />
    );
  }

  const [reports, stages] = await Promise.all([
    prisma.dailyReport.findMany({
      where: { projectId: project.id, status: "APPROVED" },
      orderBy: { date: "desc" },
      include: { photos: true },
    }),
    prisma.progressStage.findMany({
      where: { projectId: project.id },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Project summary */}
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">Your Project</p>
        <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">{project.name}</h2>
        <p className="mt-0.5 flex items-start gap-1.5 text-sm text-black/50">
          <MapPin size={15} className="mt-0.5 shrink-0" />
          {project.siteAddress}
        </p>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-[var(--foreground)]">{project.overallProgress}%</p>
            <p className="text-xs text-black/50">Complete</p>
          </div>
          <StatusBadge status={project.status} />
        </div>
        <ProgressBar value={project.overallProgress} className="mt-3" />
        <p className="mt-2 text-xs text-black/40">
          Expected completion: {formatDate(project.expectedCompletionDate)}
        </p>
      </div>

      {/* Construction stages */}
      {stages.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Construction Stages</h3>
          <div className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-xs font-semibold text-black/30">{stage.order}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{stage.name}</p>
                    <StatusBadge status={stage.status} />
                  </div>
                  <ProgressBar value={stage.progressPercentage} className="mt-1.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress feed */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Progress Updates</h3>
        {reports.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title="No updates yet"
            description="Approved daily updates from your site will appear here."
          />
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="card overflow-hidden">
                <div className="p-4">
                  <p className="text-xs font-semibold text-black/40">{formatDate(report.date)}</p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                    &ldquo;{report.workCompleted}&rdquo;
                  </p>
                </div>

                {report.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-1 px-1">
                    {report.photos.map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt={photo.caption}
                        className="aspect-square w-full rounded-md object-cover"
                      />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 p-4 pt-3 text-xs text-black/50">
                  <span className="inline-flex items-center gap-1">
                    <Camera size={13} /> {report.photos.length} Photo{report.photos.length === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} /> {report.workersCount} Workers
                  </span>
                  <span className="badge bg-brand-navy/10 text-brand-navy">{report.workCategory}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
