"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ExpenseCategory, PaymentMode } from "@prisma/client";
import { requireSupervisorSession, requireAssignedProject } from "@/lib/supervisor-guard";

export async function submitExpense(formData: FormData) {
  const session = await requireSupervisorSession();
  const projectId = String(formData.get("projectId") ?? "");
  await requireAssignedProject(projectId, session.userId);

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

  await prisma.expense.create({
    data: {
      projectId,
      category,
      amount,
      date: new Date(dateRaw),
      description,
      paidBy: session.name,
      paymentMode,
      receiptPhotoUrl,
      createdById: session.userId,
    },
  });

  revalidatePath(`/supervisor/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
  redirect(`/supervisor/projects/${projectId}`);
}
