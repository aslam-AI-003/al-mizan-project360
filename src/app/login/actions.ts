"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, homeForRole, canSignIn } from "@/lib/auth";

export type LoginResult = { error: string } | never;

export async function login(_prevState: { error: string } | null, formData: FormData): Promise<{ error: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Enter both email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message for unknown email and wrong password, so emails can't be probed.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  if (!canSignIn(user.role)) {
    return { error: "This account type is not enabled. Please contact the owner." };
  }

  await createSession({ userId: user.id, role: user.role, name: user.name, email: user.email });

  // Only allow redirects back into the app (blocks "//other-site.com" style redirects).
  const destination = next.startsWith("/admin") ? next : homeForRole(user.role);
  redirect(destination);
}
