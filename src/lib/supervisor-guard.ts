import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, type SessionPayload } from "@/lib/auth";

/**
 * Re-checks the session inside a Server Action. Server Actions are independently
 * reachable via POST, so the UI alone is never sufficient authorization.
 */
export async function requireSupervisorSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Confirms the given project is actually assigned to the given supervisor via
 * ProjectSupervisor before allowing a write. Throws if not — for use inside actions.
 */
export async function requireAssignedProject(projectId: string, supervisorId: string) {
  const link = await prisma.projectSupervisor.findUnique({
    where: { projectId_supervisorId: { projectId, supervisorId } },
  });
  if (!link) throw new Error("You are not assigned to this project");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");
  return project;
}

/**
 * Same ownership check, but for use inside a page (Server Component) render —
 * redirects instead of throwing.
 */
export async function getOwnedProjectOrRedirect(projectId: string, supervisorId: string) {
  const link = await prisma.projectSupervisor.findUnique({
    where: { projectId_supervisorId: { projectId, supervisorId } },
  });
  if (!link) redirect("/supervisor/projects");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) redirect("/supervisor/projects");
  return project;
}
