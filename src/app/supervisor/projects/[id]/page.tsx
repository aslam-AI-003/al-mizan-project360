import { redirect } from "next/navigation";
import { FileText, Image as ImageIcon } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedProjectOrRedirect } from "@/lib/supervisor-guard";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { QuickAction } from "@/components/quick-action";
import { EmptyState } from "@/components/empty-state";
import { SUPERVISOR_PROJECT_ACTIONS } from "../../action-items";

export default async function SupervisorProjectPage({ params }: PageProps<"/supervisor/projects/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");

  const project = await getOwnedProjectOrRedirect(id, session.userId);

  const [recentReports, recentPhotos] = await Promise.all([
    prisma.dailyReport.findMany({ where: { projectId: id }, orderBy: { date: "desc" }, take: 5 }),
    prisma.projectPhoto.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">{project.name}</h2>
          <StatusBadge status={project.status} />
        </div>
        <p className="mb-3 text-sm text-black/50">{project.siteAddress}</p>
        <div className="flex items-center gap-3">
          <ProgressBar value={project.overallProgress} className="flex-1" />
          <span className="text-xs font-semibold text-black/60">{project.overallProgress}%</span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Site Actions</h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {SUPERVISOR_PROJECT_ACTIONS.map((action) => (
            <QuickAction
              key={action.slug}
              href={`/supervisor/projects/${project.id}/${action.slug}`}
              label={action.label}
              icon={action.icon}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Recent Daily Reports</h3>
        {recentReports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports yet" description="Submit your first daily update above." />
        ) : (
          <div className="card divide-y divide-black/5">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{report.workCategory}</p>
                  <p className="text-xs text-black/40">
                    {formatDate(report.date)} · {report.progressPercentage}% progress
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Recent Photos</h3>
        {recentPhotos.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No photos yet" description="Upload site progress photos above." />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {recentPhotos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption}
                title={photo.caption}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
