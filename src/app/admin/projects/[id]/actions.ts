"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { ProjectStatus, StageStatus, IssueStatus, PaymentMode, MilestoneStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

export async function updateProject(formData: FormData) {
  const session = await requireAdmin();
  const projectId = String(formData.get("projectId"));

  await prisma.project.update({
    where: { id: projectId },
    data: {
      description: String(formData.get("description") ?? "") || null,
      projectManager: String(formData.get("projectManager") ?? "") || null,
      budget: Number(formData.get("budget")),
      contractValue: Number(formData.get("contractValue")),
      startDate: new Date(String(formData.get("startDate"))),
      expectedCompletionDate: new Date(String(formData.get("expectedCompletionDate"))),
      status: String(formData.get("status")) as ProjectStatus,
      overallProgress: Number(formData.get("overallProgress")),
    },
  });

  await logAudit({
    userId: session.userId,
    action: "UPDATED",
    entityType: "PROJECT",
    entityId: projectId,
    description: `Admin ${session.name} updated project details`,
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
}

export async function archiveProject(formData: FormData) {
  const session = await requireAdmin();
  const projectId = String(formData.get("projectId"));

  await prisma.project.update({ where: { id: projectId }, data: { archived: true } });
  await logAudit({
    userId: session.userId,
    action: "ARCHIVED",
    entityType: "PROJECT",
    entityId: projectId,
    description: `Admin ${session.name} archived the project`,
  });

  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function updateProgressStage(formData: FormData) {
  const session = await requireAdmin();
  const stageId = String(formData.get("stageId"));
  const projectId = String(formData.get("projectId"));
  const status = String(formData.get("status")) as StageStatus;
  const progressPercentage = Number(formData.get("progressPercentage"));
  const remarks = String(formData.get("remarks") ?? "") || null;
  const actualStartRaw = String(formData.get("actualStart") ?? "");
  const actualEndRaw = String(formData.get("actualEnd") ?? "");

  await prisma.progressStage.update({
    where: { id: stageId },
    data: {
      status,
      progressPercentage,
      remarks,
      actualStart: actualStartRaw ? new Date(actualStartRaw) : null,
      actualEnd: actualEndRaw ? new Date(actualEndRaw) : null,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "UPDATED",
    entityType: "PROGRESS_STAGE",
    entityId: stageId,
    description: `Admin ${session.name} updated a construction stage`,
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function transferMaterial(formData: FormData) {
  const session = await requireAdmin();
  const fromProjectId = String(formData.get("projectId"));
  const toProjectId = String(formData.get("toProjectId"));
  const materialId = String(formData.get("materialId"));
  const quantity = Number(formData.get("quantity"));

  if (!toProjectId || toProjectId === fromProjectId || quantity <= 0) return;

  const fromInventory = await prisma.inventory.findUnique({
    where: { projectId_materialId: { projectId: fromProjectId, materialId } },
  });
  if (!fromInventory || fromInventory.currentStock < quantity) return;

  await prisma.inventory.update({
    where: { id: fromInventory.id },
    data: { currentStock: { decrement: quantity } },
  });

  const toInventory = await prisma.inventory.upsert({
    where: { projectId_materialId: { projectId: toProjectId, materialId } },
    create: { projectId: toProjectId, materialId, currentStock: quantity },
    update: { currentStock: { increment: quantity } },
  });
  void toInventory;

  await prisma.inventoryTransaction.create({
    data: { projectId: fromProjectId, materialId, type: "TRANSFER_OUT", quantity, transferProjectId: toProjectId },
  });
  await prisma.inventoryTransaction.create({
    data: { projectId: toProjectId, materialId, type: "TRANSFER_IN", quantity, transferProjectId: fromProjectId },
  });

  await logAudit({
    userId: session.userId,
    action: "TRANSFERRED",
    entityType: "MATERIAL",
    entityId: materialId,
    description: `Admin ${session.name} transferred ${quantity} unit(s) of material between sites`,
  });

  revalidatePath(`/admin/projects/${fromProjectId}`);
  revalidatePath(`/admin/projects/${toProjectId}`);
}

export async function recordClientPayment(formData: FormData) {
  const session = await requireAdmin();
  const projectId = String(formData.get("projectId"));
  const milestoneId = String(formData.get("milestoneId") ?? "") || null;
  const amount = Number(formData.get("amount"));
  const mode = String(formData.get("mode")) as PaymentMode;
  const referenceNumber = String(formData.get("referenceNumber") ?? "") || null;
  const remarks = String(formData.get("remarks") ?? "") || null;

  const payment = await prisma.clientPayment.create({
    data: { projectId, amount, date: new Date(), mode, referenceNumber, remarks },
  });

  if (milestoneId) {
    await prisma.paymentMilestone.update({
      where: { id: milestoneId },
      data: { status: MilestoneStatus.PAID, paidDate: new Date(), referenceNumber },
    });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project) {
    await notify({
      userId: project.clientId,
      type: "PAYMENT_RECORDED",
      title: "Payment recorded",
      message: `A payment of ₹${amount.toLocaleString("en-IN")} has been recorded for ${project.name}.`,
      link: "/client/payments",
    });
  }

  await logAudit({
    userId: session.userId,
    action: "RECORDED_PAYMENT",
    entityType: "CLIENT_PAYMENT",
    entityId: payment.id,
    description: `Admin ${session.name} recorded a client payment of ₹${amount.toLocaleString("en-IN")}`,
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
}

export async function addDocument(formData: FormData) {
  const session = await requireAdmin();
  const projectId = String(formData.get("projectId"));
  const name = String(formData.get("name"));
  const type = String(formData.get("type"));
  const url = String(formData.get("url")) || `https://picsum.photos/seed/doc-${Date.now()}/800/1100`;
  const visibleToClient = formData.get("visibleToClient") === "on";

  await prisma.projectDocument.create({ data: { projectId, name, type, url, visibleToClient } });
  await logAudit({
    userId: session.userId,
    action: "UPLOADED",
    entityType: "DOCUMENT",
    entityId: projectId,
    description: `Admin ${session.name} added document "${name}"`,
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function toggleDocumentVisibility(formData: FormData) {
  await requireAdmin();
  const documentId = String(formData.get("documentId"));
  const projectId = String(formData.get("projectId"));
  const doc = await prisma.projectDocument.findUnique({ where: { id: documentId } });
  if (!doc) return;

  await prisma.projectDocument.update({
    where: { id: documentId },
    data: { visibleToClient: !doc.visibleToClient },
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function resolveIssue(formData: FormData) {
  const session = await requireAdmin();
  const issueId = String(formData.get("issueId"));
  const projectId = String(formData.get("projectId"));
  const resolution = String(formData.get("resolution") ?? "");

  await prisma.issue.update({
    where: { id: issueId },
    data: { status: IssueStatus.RESOLVED, resolution, resolvedAt: new Date() },
  });

  await logAudit({
    userId: session.userId,
    action: "RESOLVED",
    entityType: "ISSUE",
    entityId: issueId,
    description: `Admin ${session.name} resolved a site issue`,
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function recordWorkerPayment(formData: FormData) {
  const session = await requireAdmin();
  const workerId = String(formData.get("workerId"));
  const projectId = String(formData.get("projectId"));
  const amount = Number(formData.get("amount"));
  const mode = String(formData.get("mode")) as PaymentMode;
  const referenceNumber = String(formData.get("referenceNumber") ?? "") || null;

  await prisma.workerPayment.create({
    data: { workerId, projectId, amount, paymentDate: new Date(), mode, referenceNumber },
  });

  await logAudit({
    userId: session.userId,
    action: "RECORDED_PAYMENT",
    entityType: "WORKER_PAYMENT",
    entityId: workerId,
    description: `Admin ${session.name} recorded a worker wage payment of ₹${amount.toLocaleString("en-IN")}`,
  });

  revalidatePath(`/admin/projects/${projectId}`);
}
