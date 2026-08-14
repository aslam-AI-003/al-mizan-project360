"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { ProjectStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

export async function createProject(formData: FormData) {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const siteAddress = String(formData.get("siteAddress") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const clientId = String(formData.get("clientId") ?? "");
  const supervisorIds = formData.getAll("supervisorIds").map(String).filter(Boolean);
  const projectManager = String(formData.get("projectManager") ?? "").trim() || "Ibrahim Al-Mizan";
  const budget = Number(formData.get("budget") ?? 0);
  const contractValue = Number(formData.get("contractValue") ?? 0);
  const startDate = String(formData.get("startDate") ?? "");
  const expectedCompletionDate = String(formData.get("expectedCompletionDate") ?? "");
  const status = String(formData.get("status") ?? "PLANNING") as ProjectStatus;

  if (!name || !siteAddress || !clientId || !startDate || !expectedCompletionDate) {
    throw new Error("Missing required fields");
  }

  const project = await prisma.project.create({
    data: {
      name,
      siteAddress,
      description,
      clientId,
      projectManager,
      budget: Number.isFinite(budget) ? budget : 0,
      contractValue: Number.isFinite(contractValue) ? contractValue : 0,
      startDate: new Date(startDate),
      expectedCompletionDate: new Date(expectedCompletionDate),
      status,
    },
  });

  if (supervisorIds.length > 0) {
    const uniqueSupervisorIds = Array.from(new Set(supervisorIds));
    await prisma.projectSupervisor.createMany({
      data: uniqueSupervisorIds.map((supervisorId) => ({ projectId: project.id, supervisorId })),
    });
  }

  await logAudit({
    userId: session.userId,
    action: "CREATE",
    entityType: "Project",
    entityId: project.id,
    description: `Admin ${session.name} created project "${project.name}"`,
  });

  await notify({
    userId: clientId,
    type: "PROJECT_CREATED",
    title: "New project created",
    message: `Your project "${project.name}" has been set up.`,
    link: `/client`,
  });

  for (const supervisorId of supervisorIds) {
    await notify({
      userId: supervisorId,
      type: "PROJECT_ASSIGNED",
      title: "Assigned to a new project",
      message: `You have been assigned as supervisor for "${project.name}".`,
      link: `/supervisor/projects/${project.id}`,
    });
  }

  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  redirect(`/admin/projects/${project.id}`);
}
