"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireSupervisorSession, requireAssignedProject, notifyAdmins } from "@/lib/supervisor-guard";

export async function logUsage(formData: FormData) {
  const session = await requireSupervisorSession();
  const projectId = String(formData.get("projectId") ?? "");
  const project = await requireAssignedProject(projectId, session.userId);

  const materialId = String(formData.get("materialId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  if (!materialId || quantity <= 0) throw new Error("Invalid usage entry");

  const inventory = await prisma.inventory.findUnique({
    where: { projectId_materialId: { projectId, materialId } },
    include: { material: true },
  });
  if (!inventory) throw new Error("No inventory record for this material on this project");

  await prisma.inventoryTransaction.create({
    data: { projectId, materialId, type: "USAGE", quantity, notes: `Logged by ${session.name}` },
  });

  const newStock = Math.max(0, inventory.currentStock - quantity);
  await prisma.inventory.update({ where: { id: inventory.id }, data: { currentStock: newStock } });

  await logAudit({
    userId: session.userId,
    action: "MATERIAL_USAGE",
    entityType: "INVENTORY",
    entityId: inventory.id,
    description: `${session.name} logged usage of ${quantity} ${inventory.material.unit} of ${inventory.material.name} on ${project.name}`,
  });

  if (newStock <= inventory.lowStockAt) {
    await notifyAdmins({
      type: "LOW_STOCK",
      title: "Low stock alert",
      message: `${inventory.material.name} is low on ${project.name} — ${newStock} ${inventory.material.unit} remaining.`,
      link: `/admin/projects/${projectId}`,
    });
  }

  revalidatePath(`/supervisor/projects/${projectId}/materials`);
  revalidatePath(`/supervisor/projects/${projectId}`);
  redirect(`/supervisor/projects/${projectId}`);
}
