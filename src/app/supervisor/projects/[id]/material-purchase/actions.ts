"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSupervisorSession, requireAssignedProject } from "@/lib/supervisor-guard";

/** Records material bought for the site: counts as that day's material charge and adds to site stock. */
export async function recordMaterialPurchase(formData: FormData) {
  const session = await requireSupervisorSession();
  const projectId = String(formData.get("projectId") ?? "");
  await requireAssignedProject(projectId, session.userId);

  const materialId = String(formData.get("materialId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const unit = String(formData.get("unit") ?? "").trim();
  const rate = Number(formData.get("rate") ?? 0);
  const dateRaw = String(formData.get("date") ?? "");
  const vendorName = String(formData.get("vendorName") ?? "").trim() || null;
  const billPhotoUrl = String(formData.get("billPhotoUrl") ?? "").trim() || null;
  const remarks = String(formData.get("remarks") ?? "").trim() || null;

  if (!materialId || !(quantity > 0) || !unit || !(rate > 0) || !dateRaw) {
    throw new Error("All required fields must be filled correctly");
  }
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) throw new Error("Invalid material");

  const date = new Date(dateRaw);

  await prisma.$transaction([
    prisma.purchase.create({
      data: {
        projectId,
        materialId,
        quantity,
        unit,
        rate,
        totalAmount: quantity * rate,
        date,
        vendorName,
        billPhotoUrl,
        remarks,
        createdById: session.userId,
      },
    }),
    prisma.inventory.upsert({
      where: { projectId_materialId: { projectId, materialId } },
      create: { projectId, materialId, currentStock: quantity },
      update: { currentStock: { increment: quantity } },
    }),
    prisma.inventoryTransaction.create({
      data: { projectId, materialId, type: "PURCHASE", quantity, date, notes: `Bought by ${session.name}` },
    }),
  ]);

  revalidatePath(`/supervisor/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
  redirect(`/supervisor/projects/${projectId}`);
}
