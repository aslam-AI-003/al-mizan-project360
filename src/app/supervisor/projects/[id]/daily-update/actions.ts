"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSupervisorSession, requireAssignedProject } from "@/lib/supervisor-guard";

export async function submitDailyUpdate(formData: FormData) {
  const session = await requireSupervisorSession();
  const projectId = String(formData.get("projectId") ?? "");
  const project = await requireAssignedProject(projectId, session.userId);

  const dateRaw = String(formData.get("date") ?? "");
  const workCompleted = String(formData.get("workCompleted") ?? "").trim();
  const workCategory = String(formData.get("workCategory") ?? "").trim();
  const progressPercentage = Math.max(0, Math.min(100, Number(formData.get("progressPercentage") ?? 0)));
  const workersCount = Math.max(0, Math.round(Number(formData.get("workersCount") ?? 0)));
  const materialsUsed = String(formData.get("materialsUsed") ?? "").trim() || "Not specified";
  const issues = String(formData.get("issues") ?? "").trim() || null;
  const tomorrowPlan = String(formData.get("tomorrowPlan") ?? "").trim();
  const remarks = String(formData.get("remarks") ?? "").trim() || null;
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();

  if (!dateRaw || !workCompleted || !workCategory || !tomorrowPlan) {
    throw new Error("Missing required fields for daily update");
  }

  const date = new Date(dateRaw);

  const report = await prisma.dailyReport.create({
    data: {
      projectId,
      date,
      workCompleted,
      workCategory,
      progressPercentage,
      workersCount,
      materialsUsed,
      issues,
      tomorrowPlan,
      remarks,
      createdById: session.userId,
    },
  });

  if (photoUrl) {
    await prisma.projectPhoto.create({
      data: {
        projectId,
        dailyReportId: report.id,
        url: photoUrl,
        caption: workCategory,
        workCategory,
        uploadedById: session.userId,
      },
    });
  }

  // No approval step: the reported progress updates the project straight away (never goes backwards).
  if (progressPercentage > project.overallProgress) {
    await prisma.project.update({ where: { id: projectId }, data: { overallProgress: progressPercentage } });
  }

  revalidatePath(`/supervisor/projects/${projectId}`);
  revalidatePath(`/supervisor`);
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/supervisor/projects/${projectId}`);
}
