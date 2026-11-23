"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";
import { requireSupervisorSession, requireAssignedProject } from "@/lib/supervisor-guard";
import { todayRangeUTC } from "@/lib/date-range";

export async function submitAttendance(formData: FormData) {
  const session = await requireSupervisorSession();
  const projectId = String(formData.get("projectId") ?? "");
  await requireAssignedProject(projectId, session.userId);

  const workers = await prisma.worker.findMany({ where: { projectId, status: "ACTIVE" } });
  const today = todayRangeUTC().gte;


  for (const worker of workers) {
    const statusRaw = String(formData.get(`status-${worker.id}`) ?? "");
    if (!Object.values(AttendanceStatus).includes(statusRaw as AttendanceStatus)) continue;
    const status = statusRaw as AttendanceStatus;

    const overtimeHoursRaw = Number(formData.get(`overtime-${worker.id}`) ?? 2);
    const overtimeHours = status === "OVERTIME" ? (overtimeHoursRaw > 0 ? overtimeHoursRaw : 2) : 0;

    let wageAmount = 0;
    if (status === "PRESENT") wageAmount = worker.dailyWage;
    else if (status === "HALF_DAY") wageAmount = worker.dailyWage / 2;
    else if (status === "OVERTIME") wageAmount = worker.dailyWage + (worker.dailyWage / 8) * overtimeHours;


    await prisma.workerAttendance.upsert({
      where: { workerId_date: { workerId: worker.id, date: today } },
      update: { status, overtimeHours, wageAmount },
      create: { workerId: worker.id, projectId, date: today, status, overtimeHours, wageAmount },
    });
  }


  revalidatePath(`/supervisor/projects/${projectId}/attendance`);
  revalidatePath(`/supervisor/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
  redirect(`/supervisor/projects/${projectId}`);
}
