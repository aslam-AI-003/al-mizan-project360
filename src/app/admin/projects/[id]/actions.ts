"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ProjectStatus, StageStatus, PaymentMode } from "@prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

export async function updateProject(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId"));

  await prisma.project.update({
    where: { id: projectId },
    data: {
      clientName: String(formData.get("clientName") ?? "").trim(),
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


  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
}

export async function archiveProject(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId"));

  await prisma.project.update({ where: { id: projectId }, data: { archived: true } });

  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function updateProgressStage(formData: FormData) {
  await requireAdmin();
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


  revalidatePath(`/admin/projects/${projectId}`);
}

export async function transferMaterial(formData: FormData) {
  await requireAdmin();
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


  revalidatePath(`/admin/projects/${fromProjectId}`);
  revalidatePath(`/admin/projects/${toProjectId}`);
}

export async function recordWorkerPayment(formData: FormData) {
  await requireAdmin();
  const workerId = String(formData.get("workerId"));
  const projectId = String(formData.get("projectId"));
  const amount = Number(formData.get("amount"));
  const mode = String(formData.get("mode")) as PaymentMode;
  const referenceNumber = String(formData.get("referenceNumber") ?? "") || null;

  await prisma.workerPayment.create({
    data: { workerId, projectId, amount, paymentDate: new Date(), mode, referenceNumber },
  });


  revalidatePath(`/admin/projects/${projectId}`);
}
