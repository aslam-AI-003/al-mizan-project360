"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSupervisorSession } from "@/lib/supervisor-guard";

export async function markAllRead() {
  const session = await requireSupervisorSession();
  await prisma.notification.updateMany({
    where: { userId: session.userId, read: false },
    data: { read: true },
  });
  revalidatePath("/supervisor/notifications");
  revalidatePath("/supervisor");
}

export async function markOneRead(formData: FormData) {
  const session = await requireSupervisorSession();
  const notificationId = String(formData.get("notificationId") ?? "");
  const link = String(formData.get("link") ?? "").trim();

  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (notification && notification.userId === session.userId) {
    await prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
  }

  revalidatePath("/supervisor/notifications");
  revalidatePath("/supervisor");

  if (link && link.startsWith("/")) {
    redirect(link);
  }
  redirect("/supervisor/notifications");
}
