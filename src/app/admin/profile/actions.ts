"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { requireOwner } from "@/lib/owner-guard";

export type FormState = { error?: string; success?: string } | null;

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name || !email) return { error: "Name and email are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  const clash = await prisma.user.findUnique({ where: { email } });
  if (clash && clash.id !== session.userId) return { error: "That email is already in use." };

  const user = await prisma.user.update({ where: { id: session.userId }, data: { name, email, phone } });
  // Refresh the session so the new name/email show straight away.
  await createSession({ userId: user.id, role: user.role, name: user.name, email: user.email });
  revalidatePath("/admin", "layout");
  return { success: "Profile updated." };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireOwner();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!current || !next || !confirm) return { error: "All fields are required." };
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New password and confirmation do not match." };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { error: "Current password is incorrect." };

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { success: "Password updated." };
}
