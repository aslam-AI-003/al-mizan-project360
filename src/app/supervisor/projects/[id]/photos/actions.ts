"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireSupervisorSession, requireAssignedProject } from "@/lib/supervisor-guard";

export async function uploadPhoto(formData: FormData) {
  const session = await requireSupervisorSession();
  const projectId = String(formData.get("projectId") ?? "");
  const project = await requireAssignedProject(projectId, session.userId);

  const presetUrl = String(formData.get("presetUrl") ?? "").trim();
  const customUrl = String(formData.get("customUrl") ?? "").trim();
  const workCategory = String(formData.get("workCategory") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  if (!workCategory || !caption) throw new Error("Work category and caption are required");

  const url = customUrl || presetUrl || `https://picsum.photos/seed/upload-${Date.now()}/900/700`;

  await prisma.projectPhoto.create({
    data: { projectId, url, caption, workCategory, uploadedById: session.userId },
  });

  await logAudit({
    userId: session.userId,
    action: "UPLOADED_PHOTO",
    entityType: "PROJECT_PHOTO",
    entityId: projectId,
    description: `${session.name} uploaded a site photo (${workCategory}) for ${project.name}`,
  });

  revalidatePath(`/supervisor/projects/${projectId}/photos`);
  revalidatePath(`/supervisor/projects/${projectId}`);
  redirect(`/supervisor/projects/${projectId}`);
}
