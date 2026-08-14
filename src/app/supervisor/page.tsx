import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayRangeUTC } from "@/lib/date-range";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { QuickAction } from "@/components/quick-action";
import { EmptyState } from "@/components/empty-state";
import { SUPERVISOR_PROJECT_ACTIONS } from "./action-items";

export default async function SupervisorHomePage() {
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");

  const links = await prisma.projectSupervisor.findMany({
    where: { supervisorId: session.userId },
    include: { project: true },
    orderBy: { createdAt: "asc" },
  });

  const today = todayRangeUTC();

  const projectsWithStatus = await Promise.all(
    links.map(async (link) => {
      const report = await prisma.dailyReport.findFirst({
        where: { projectId: link.projectId, date: today },
      });
      return { project: link.project, reportSubmitted: !!report };
    })
  );

  const singleProjectId = projectsWithStatus.length === 1 ? projectsWithStatus[0].project.id : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Welcome, {session.name.split(" ")[0]}</h2>
        <p className="text-sm text-black/50">{formatDate(new Date())}</p>
      </div>

      <div className="space-y-3">
        {projectsWithStatus.length === 0 && (
          <EmptyState
            icon={Building2}
            title="No projects assigned"
            description="Contact the admin if this looks wrong."
          />
        )}
        {projectsWithStatus.map(({ project, reportSubmitted }) => (
          <Link
            key={project.id}
            href={`/supervisor/projects/${project.id}`}
            className="card block p-4 transition active:scale-[0.99] hover:border-brand-navy/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--foreground)]">{project.name}</p>
                <p className="truncate text-xs text-black/50">{project.siteAddress}</p>
              </div>
              <StatusBadge
                status={reportSubmitted ? "SUBMITTED" : "PENDING"}
                label={reportSubmitted ? "Submitted" : "Not yet submitted"}
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={project.overallProgress} className="flex-1" />
              <span className="text-xs font-semibold text-black/60">{project.overallProgress}%</span>
            </div>
          </Link>
        ))}
      </div>

      {projectsWithStatus.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Quick Actions</h3>
          <p className="mb-3 text-xs text-black/40">
            {singleProjectId
              ? "For your assigned project."
              : "Pick a project first — you have more than one assigned."}
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {SUPERVISOR_PROJECT_ACTIONS.map((action) => (
              <QuickAction
                key={action.slug}
                href={singleProjectId ? `/supervisor/projects/${singleProjectId}/${action.slug}` : "/supervisor/projects"}
                label={action.label}
                icon={action.icon}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
