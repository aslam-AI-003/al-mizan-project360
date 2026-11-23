"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireSupervisorSession } from "@/lib/supervisor-guard";

export type ChangePasswordState = { error?: string; success?: string };

export async function changePassword(
  _prevState: ChangePasswordState | null,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await requireSupervisorSession();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "User not found." };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });


  return { success: "Password updated successfully." };
}
