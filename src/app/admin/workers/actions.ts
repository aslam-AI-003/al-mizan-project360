"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { WorkerType } from "@prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

async function nextWorkerCode() {
  const last = await prisma.worker.findMany({
    select: { workerCode: true },
    orderBy: { workerCode: "desc" },
    take: 1,
  });
  const lastNum = last[0]?.workerCode ? parseInt(last[0].workerCode.replace(/\D/g, ""), 10) : 0;
  const next = Number.isFinite(lastNum) ? lastNum + 1 : 1;
  return `WRK-${String(next).padStart(3, "0")}`;
}

export async function createWorker(formData: FormData) {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const mobile = String(formData.get("mobile") ?? "").trim();
  const workerType = String(formData.get("workerType") ?? "OTHER") as WorkerType;
  const dailyWage = Number(formData.get("dailyWage") ?? 0);
  const joiningDate = String(formData.get("joiningDate") ?? "");
  const projectId = String(formData.get("projectId") ?? "");

  if (!name || !mobile || !projectId || !joiningDate) {
    throw new Error("Missing required fields");
  }

  const workerCode = await nextWorkerCode();

  const worker = await prisma.worker.create({
    data: {
      workerCode,
      name,
      mobile,
      workerType,
      dailyWage: Number.isFinite(dailyWage) ? dailyWage : 0,
      joiningDate: new Date(joiningDate),
      projectId,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "CREATE",
    entityType: "Worker",
    entityId: worker.id,
    description: `Admin ${session.name} added worker ${worker.name} (${worker.workerCode})`,
  });

  revalidatePath("/admin/workers");
}

export async function toggleWorkerStatus(formData: FormData) {
  const session = await requireAdmin();
  const workerId = String(formData.get("workerId") ?? "");
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) return;

  const nextStatus = worker.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.worker.update({ where: { id: workerId }, data: { status: nextStatus } });

  await logAudit({
    userId: session.userId,
    action: "UPDATE",
    entityType: "Worker",
    entityId: worker.id,
    description: `Admin ${session.name} marked worker ${worker.name} as ${nextStatus.toLowerCase()}`,
  });

  revalidatePath("/admin/workers");
}
