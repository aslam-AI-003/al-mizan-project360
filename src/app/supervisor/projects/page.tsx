import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { EmptyState } from "@/components/empty-state";

export default async function SupervisorProjectsPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");

  const links = await prisma.projectSupervisor.findMany({
    where: { supervisorId: session.userId },
    include: { project: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">My Projects</h2>
        <p className="text-sm text-black/50">{links.length} project(s) assigned to you.</p>
      </div>

      {links.length === 0 ? (
        <EmptyState icon={Building2} title="No projects assigned" description="Contact the admin if this looks wrong." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {links.map(({ project }) => (
            <Link
              key={project.id}
              href={`/supervisor/projects/${project.id}`}
              className="card block p-4 transition active:scale-[0.99] hover:border-brand-navy/20"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="font-bold text-[var(--foreground)]">{project.name}</p>
                <StatusBadge status={project.status} />
              </div>
              <p className="mb-3 text-xs text-black/50">{project.siteAddress}</p>
              <div className="flex items-center gap-3">
                <ProgressBar value={project.overallProgress} className="flex-1" />
                <span className="text-xs font-semibold text-black/60">{project.overallProgress}%</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
