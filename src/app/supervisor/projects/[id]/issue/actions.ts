"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { IssuePriority } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { requireSupervisorSession, requireAssignedProject, notifyAdmins } from "@/lib/supervisor-guard";

export async function reportIssue(formData: FormData) {
  const session = await requireSupervisorSession();
  const projectId = String(formData.get("projectId") ?? "");
  const project = await requireAssignedProject(projectId, session.userId);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "");
  const photoUrl = String(formData.get("photoUrl") ?? "").trim() || null;

  if (!title || !description || !Object.values(IssuePriority).includes(priorityRaw as IssuePriority)) {
    throw new Error("Missing required fields");
  }
  const priority = priorityRaw as IssuePriority;

  const issue = await prisma.issue.create({
    data: { projectId, title, description, priority, photoUrl, reportedById: session.userId, status: "OPEN" },
  });

  await logAudit({
    userId: session.userId,
    action: "REPORTED_ISSUE",
    entityType: "ISSUE",
    entityId: issue.id,
    description: `${session.name} reported a ${priority.toLowerCase()} priority issue on ${project.name}: ${title}`,
  });

  await notifyAdmins({
    type: "ISSUE_REPORTED",
    title: priority === "CRITICAL" ? "Critical issue reported" : priority === "HIGH" ? "High priority issue reported" : "New issue reported",
    message: `${session.name} reported "${title}" on ${project.name}.`,
    link: `/admin/projects/${projectId}`,
  });

  revalidatePath(`/supervisor/projects/${projectId}`);
  redirect(`/supervisor/projects/${projectId}`);
}
