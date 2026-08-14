"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ApprovalType, ApprovalStatus } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { requireSupervisorSession, requireAssignedProject, notifyAdmins } from "@/lib/supervisor-guard";

export async function submitPurchaseRequest(formData: FormData) {
  const session = await requireSupervisorSession();
  const projectId = String(formData.get("projectId") ?? "");
  const project = await requireAssignedProject(projectId, session.userId);

  const supplierId = String(formData.get("supplierId") ?? "");
  const materialId = String(formData.get("materialId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const unit = String(formData.get("unit") ?? "").trim();
  const rate = Number(formData.get("rate") ?? 0);
  const requiredDateRaw = String(formData.get("requiredDate") ?? "");
  const remarks = String(formData.get("remarks") ?? "").trim() || null;

  if (!supplierId || !materialId || quantity <= 0 || !unit || rate <= 0 || !requiredDateRaw) {
    throw new Error("All required fields must be filled correctly");
  }

  const [supplier, material] = await Promise.all([
    prisma.supplier.findUnique({ where: { id: supplierId } }),
    prisma.material.findUnique({ where: { id: materialId } }),
  ]);
  if (!supplier || !material) throw new Error("Invalid supplier or material");

  const totalAmount = quantity * rate;

  const purchase = await prisma.purchase.create({
    data: {
      projectId,
      supplierId,
      materialId,
      quantity,
      unit,
      rate,
      totalAmount,
      requiredDate: new Date(requiredDateRaw),
      status: "SUBMITTED",
      remarks,
      requestedById: session.userId,
    },
  });

  await prisma.approval.create({
    data: {
      type: ApprovalType.PURCHASE,
      refId: purchase.id,
      refLabel: `Purchase request — ${quantity} ${unit} of ${material.name} for ${project.name}`,
      status: ApprovalStatus.PENDING,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "SUBMITTED",
    entityType: "PURCHASE",
    entityId: purchase.id,
    description: `${session.name} requested ${quantity} ${unit} of ${material.name} for ${project.name}`,
  });

  await notifyAdmins({
    type: "PURCHASE_REQUEST",
    title: "New purchase request",
    message: `${session.name} requested ${quantity} ${unit} of ${material.name} for ${project.name}.`,
    link: "/admin/approvals",
  });

  revalidatePath(`/supervisor/projects/${projectId}`);
  redirect(`/supervisor/projects/${projectId}`);
}
