"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { ApprovalStatus, ApprovalType, PurchaseStatus, ExpenseStatus, DailyReportStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

export async function decideApproval(formData: FormData) {
  const session = await requireAdmin();

  const approvalId = String(formData.get("approvalId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "APPROVED" | "REJECTED" | "SENT_BACK";
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const approval = await prisma.approval.findUnique({ where: { id: approvalId } });
  if (!approval || approval.status !== ApprovalStatus.PENDING) return;

  let projectId: string | null = null;
  let submitterId: string | null = null;
  let itemLabel = approval.refLabel;

  if (approval.type === ApprovalType.PURCHASE) {
    const purchase = await prisma.purchase.update({
      where: { id: approval.refId },
      data: {
        status:
          decision === "APPROVED"
            ? PurchaseStatus.APPROVED
            : decision === "REJECTED"
              ? PurchaseStatus.REJECTED
              : PurchaseStatus.SUBMITTED,
        approvedById: decision === "APPROVED" ? session.userId : null,
      },
      include: { project: true },
    });
    projectId = purchase.projectId;
    submitterId = purchase.requestedById;
    itemLabel = `Purchase request for ${purchase.project.name}`;
  } else if (approval.type === ApprovalType.EXPENSE) {
    const expense = await prisma.expense.update({
      where: { id: approval.refId },
      data: {
        status:
          decision === "APPROVED"
            ? ExpenseStatus.APPROVED
            : decision === "REJECTED"
              ? ExpenseStatus.REJECTED
              : ExpenseStatus.SUBMITTED,
      },
      include: { project: true },
    });
    projectId = expense.projectId;
    submitterId = expense.createdById;
    itemLabel = `${expense.category.replace("_", " ")} expense for ${expense.project.name}`;
  } else if (approval.type === ApprovalType.DAILY_REPORT) {
    const report = await prisma.dailyReport.update({
      where: { id: approval.refId },
      data: {
        status:
          decision === "APPROVED"
            ? DailyReportStatus.APPROVED
            : decision === "REJECTED"
              ? DailyReportStatus.REJECTED
              : DailyReportStatus.SUBMITTED,
        approvedById: decision === "APPROVED" ? session.userId : null,
        approvedAt: decision === "APPROVED" ? new Date() : null,
      },
      include: { project: true },
    });
    projectId = report.projectId;
    submitterId = report.createdById;
    itemLabel = `Daily report for ${report.project.name}`;

    if (decision === "APPROVED") {
      await prisma.project.update({
        where: { id: report.projectId },
        data: { overallProgress: Math.max(report.project.overallProgress, report.progressPercentage) },
      });
    }
  }

  await prisma.approval.update({
    where: { id: approvalId },
    data: { status: ApprovalStatus[decision], comment, actedById: session.userId, actedAt: new Date() },
  });

  await logAudit({
    userId: session.userId,
    action: decision,
    entityType: approval.type,
    entityId: approval.refId,
    description: `Admin ${session.name} ${decision.toLowerCase().replace("_", " ")} — ${itemLabel}`,
  });

  if (submitterId) {
    await notify({
      userId: submitterId,
      type: "APPROVAL_DECISION",
      title: decision === "APPROVED" ? "Report approved" : decision === "REJECTED" ? "Report rejected" : "Changes requested",
      message: `${itemLabel}: ${decision === "APPROVED" ? "approved" : decision === "REJECTED" ? "rejected" : "sent back for changes"}${comment ? ` — "${comment}"` : ""}.`,
      link: projectId ? `/supervisor/projects/${projectId}` : undefined,
    });
  }

  if (projectId && approval.type === ApprovalType.DAILY_REPORT && decision === "APPROVED") {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true, name: true } });
    if (project) {
      await notify({
        userId: project.clientId,
        type: "PROGRESS_UPDATE",
        title: "New progress update",
        message: `A new approved progress update is available for ${project.name}.`,
        link: `/client`,
      });
    }
  }

  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  if (projectId) revalidatePath(`/admin/projects/${projectId}`);
}
