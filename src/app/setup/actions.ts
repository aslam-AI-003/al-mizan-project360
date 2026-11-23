"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export type SetupState = { error?: string } | null;

/** One-time creation of the first Owner account. Disabled once any Owner exists. */
export async function createOwner(_prev: SetupState, formData: FormData): Promise<SetupState> {
  if ((await prisma.user.count({ where: { role: "ADMIN" } })) > 0) {
    return { error: "Setup is already complete. Please sign in." };
  }

  const requiredCode = process.env.SETUP_CODE;
  if (requiredCode && String(formData.get("setupCode") ?? "") !== requiredCode) {
    return { error: "Setup code is incorrect." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!name || !email) return { error: "Name and email are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };
  if (await prisma.user.findUnique({ where: { email } })) return { error: "That email is already in use." };

  const user = await prisma.user.create({
    data: { name, email, phone, role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession({ userId: user.id, role: user.role, name: user.name, email: user.email });
  redirect("/admin");
}
