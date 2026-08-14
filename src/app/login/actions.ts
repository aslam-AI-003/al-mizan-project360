"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, homeForRole } from "@/lib/auth";

export type LoginResult = { error: string } | never;

export async function login(_prevState: { error: string } | null, formData: FormData): Promise<{ error: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Enter both email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "No account found with that email." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Incorrect password." };
  }

  await createSession({ userId: user.id, role: user.role, name: user.name, email: user.email });

  const destination = next && next.startsWith("/") ? next : homeForRole(user.role);
  redirect(destination);
}
