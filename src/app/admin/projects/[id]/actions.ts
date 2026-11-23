"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/owner-guard";

export async function updateProject(formData: FormData) {
  await requireOwner();
  const projectId = String(formData.get("projectId"));
  const status = String(formData.get("status"));
  if (!Object.values(ProjectStatus).includes(status as ProjectStatus)) throw new Error("Invalid status");
  const num = (key: string) => {
    const n = Number(formData.get(key));
    return Number.isFinite(n) ? n : 0;
  };

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: String(formData.get("name") ?? "").trim() || undefined,
      siteAddress: String(formData.get("siteAddress") ?? "").trim() || undefined,
      clientName: String(formData.get("clientName") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      budget: num("budget"),
      contractValue: num("contractValue"),
      startDate: new Date(String(formData.get("startDate"))),
      expectedCompletionDate: new Date(String(formData.get("expectedCompletionDate"))),
      status: status as ProjectStatus,
      overallProgress: Math.max(0, Math.min(100, Math.round(num("overallProgress")))),
    },
  });
  revalidatePath("/admin", "layout");
}

export async function archiveProject(formData: FormData) {
  await requireOwner();
  const projectId = String(formData.get("projectId"));
  await prisma.project.update({ where: { id: projectId }, data: { archived: true } });
  revalidatePath("/admin", "layout");
  redirect("/admin");
}
