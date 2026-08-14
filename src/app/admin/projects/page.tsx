import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { EmptyState } from "@/components/empty-state";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { archived: false },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Projects</h2>
          <p className="text-sm text-black/50">{projects.length} project(s) in the portfolio.</p>
        </div>
        <Link href="/admin/projects/new" className="btn-primary btn-sm shrink-0">
          <Plus size={16} /> New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No projects yet"
          description="Create your first project to get started."
        />
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {projects.map((project) => (
              <Link key={project.id} href={`/admin/projects/${project.id}`} className="card block p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--foreground)]">{project.name}</p>
                    <p className="truncate text-xs text-black/50">{project.siteAddress}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <p className="mb-3 text-xs text-black/50">Client: {project.client.name}</p>
                <div className="mb-1 flex items-center justify-between text-xs text-black/50">
                  <span>Progress</span>
                  <span className="font-semibold text-[var(--foreground)]">{project.overallProgress}%</span>
                </div>
                <ProgressBar value={project.overallProgress} className="mb-3" />
                <p className="text-sm font-semibold text-brand-navy">{formatINR(project.contractValue)}</p>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-xs font-semibold text-black/50">
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3 text-right">Contract Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {projects.map((project) => (
                  <tr key={project.id} className="transition hover:bg-black/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/projects/${project.id}`} className="block">
                        <p className="font-semibold text-[var(--foreground)]">{project.name}</p>
                        <p className="text-xs text-black/50">{project.siteAddress}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-black/70">{project.client.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={project.overallProgress} className="w-24" />
                        <span className="text-xs font-semibold text-black/60">{project.overallProgress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-navy">
                      {formatINR(project.contractValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
