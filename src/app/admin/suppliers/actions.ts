"use server";

import { revalidatePath } from "next/cache";
import { PaymentMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/owner-guard";
import { dayRange, isDayKey } from "@/lib/date-range";

export async function addSupplier(formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  if (!name) throw new Error("Supplier name is required");
  const existing = await prisma.supplier.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (existing) {
    if (phone) await prisma.supplier.update({ where: { id: existing.id }, data: { phone } });
  } else {
    await prisma.supplier.create({ data: { name, phone } });
  }
  revalidatePath("/admin/suppliers");
}

export async function updateSupplier(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("supplierId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  if (!id || !name) throw new Error("Supplier name is required");
  await prisma.supplier.update({ where: { id }, data: { name, phone } });
  revalidatePath("/admin", "layout");
}

export async function recordSupplierPayment(formData: FormData) {
  await requireOwner();
  const supplierId = String(formData.get("supplierId") ?? "");
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "");
  const mode = String(formData.get("mode") ?? "CASH");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!supplierId || !(amount > 0) || !isDayKey(date)) throw new Error("Enter a valid amount and date");
  if (!Object.values(PaymentMode).includes(mode as PaymentMode)) throw new Error("Invalid payment mode");
  if (!(await prisma.supplier.findUnique({ where: { id: supplierId } }))) throw new Error("Supplier not found");

  await prisma.supplierPayment.create({
    data: { supplierId, amount, date: dayRange(date).gte, mode: mode as PaymentMode, note },
  });
  revalidatePath("/admin", "layout");
}

export async function deleteSupplierPayment(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("paymentId") ?? "");
  await prisma.supplierPayment.delete({ where: { id } });
  revalidatePath("/admin", "layout");
}
