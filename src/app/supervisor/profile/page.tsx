import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { titleCase } from "@/lib/format";
import { ChangePasswordForm } from "./password-form";

export default async function SupervisorProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  const links = await prisma.projectSupervisor.findMany({
    where: { supervisorId: session.userId },
    include: { project: true },
    orderBy: { createdAt: "asc" },
  });

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-navy text-lg font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="text-base font-bold text-[var(--foreground)]">{user.name}</p>
            <p className="text-xs text-black/50">{titleCase(user.role)}</p>
          </div>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-black/50">Email</dt>
            <dd className="truncate font-medium text-[var(--foreground)]">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-black/50">Phone</dt>
            <dd className="font-medium text-[var(--foreground)]">{user.phone ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Assigned Projects</h3>
        <div className="card divide-y divide-black/5">
          {links.map(({ project }) => (
            <div key={project.id} className="p-3.5">
              <p className="text-sm font-medium text-[var(--foreground)]">{project.name}</p>
              <p className="text-xs text-black/40">{project.siteAddress}</p>
            </div>
          ))}
          {links.length === 0 && <p className="p-4 text-sm text-black/40">No projects assigned.</p>}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Change Password</h3>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

