"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ApprovalType, ApprovalStatus, ExpenseCategory, PaymentMode } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { requireSupervisorSession, requireAssignedProject, notifyAdmins } from "@/lib/supervisor-guard";
import { formatINR } from "@/lib/format";

export async function submitExpense(formData: FormData) {
  const session = await requireSupervisorSession();
  const projectId = String(formData.get("projectId") ?? "");
  const project = await requireAssignedProject(projectId, session.userId);

  const categoryRaw = String(formData.get("category") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const dateRaw = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const paymentModeRaw = String(formData.get("paymentMode") ?? "");
  const receiptPhotoUrlRaw = String(formData.get("receiptPhotoUrl") ?? "").trim();

  if (!Object.values(ExpenseCategory).includes(categoryRaw as ExpenseCategory)) throw new Error("Invalid category");
  if (!Object.values(PaymentMode).includes(paymentModeRaw as PaymentMode)) throw new Error("Invalid payment mode");
  if (amount <= 0 || !description || !dateRaw) throw new Error("Missing required fields");

  const category = categoryRaw as ExpenseCategory;
  const paymentMode = paymentModeRaw as PaymentMode;
  const receiptPhotoUrl = receiptPhotoUrlRaw || `https://picsum.photos/seed/receipt-${Date.now()}/600/800`;

  const expense = await prisma.expense.create({
    data: {
      projectId,
      category,
      amount,
      date: new Date(dateRaw),
      description,
      paidBy: session.name,
      paymentMode,
      receiptPhotoUrl,
      status: "SUBMITTED",
      createdById: session.userId,
    },
  });

  await prisma.approval.create({
    data: {
      type: ApprovalType.EXPENSE,
      refId: expense.id,
      refLabel: `${category.replace("_", " ")} expense — ${formatINR(amount)} for ${project.name}`,
      status: ApprovalStatus.PENDING,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "SUBMITTED",
    entityType: "EXPENSE",
    entityId: expense.id,
    description: `${session.name} logged a ${category.replace("_", " ").toLowerCase()} expense of ${formatINR(amount)} for ${project.name}`,
  });

  await notifyAdmins({
    type: "EXPENSE_SUBMITTED",
    title: "New expense submitted",
    message: `${session.name} logged an expense of ${formatINR(amount)} for ${project.name}.`,
    link: "/admin/approvals",
  });

  revalidatePath(`/supervisor/projects/${projectId}`);
  redirect(`/supervisor/projects/${projectId}`);
}
