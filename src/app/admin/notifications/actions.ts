"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

export async function markAllRead() {
  const session = await requireAdmin();
  await prisma.notification.updateMany({ where: { userId: session.userId, read: false }, data: { read: true } });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}

export async function openNotification(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const link = String(formData.get("link") ?? "");

  const notification = await prisma.notification.findFirst({ where: { id, userId: session.userId } });
  if (notification && !notification.read) {
    await prisma.notification.update({ where: { id }, data: { read: true } });
  }

  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
  redirect(link || "/admin/notifications");
}
