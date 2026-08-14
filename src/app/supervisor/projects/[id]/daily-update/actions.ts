"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ApprovalType, ApprovalStatus } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { requireSupervisorSession, requireAssignedProject, notifyAdmins } from "@/lib/supervisor-guard";
import { formatDate } from "@/lib/format";

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
      status: "SUBMITTED",
      createdById: session.userId,
    },
  });

  await prisma.approval.create({
    data: {
      type: ApprovalType.DAILY_REPORT,
      refId: report.id,
      refLabel: `Daily report — ${project.name} (${formatDate(date)})`,
      status: ApprovalStatus.PENDING,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "SUBMITTED",
    entityType: "DAILY_REPORT",
    entityId: report.id,
    description: `${session.name} submitted a daily report for ${project.name}`,
  });

  await notifyAdmins({
    type: "DAILY_REPORT",
    title: "New daily report submitted",
    message: `${session.name} submitted a daily report for ${project.name}.`,
    link: "/admin/approvals",
  });

  revalidatePath(`/supervisor/projects/${projectId}`);
  revalidatePath(`/supervisor`);
  redirect(`/supervisor/projects/${projectId}`);
}
