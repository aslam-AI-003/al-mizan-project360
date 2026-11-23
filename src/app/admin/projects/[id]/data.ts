import { prisma } from "@/lib/db";

export async function getProjectHeader(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      supervisors: { include: { supervisor: true } },
    },
  });
}

export function getProgressData(id: string) {
  return prisma.progressStage.findMany({ where: { projectId: id }, orderBy: { order: "asc" } });
}

export function getDailyUpdatesData(id: string) {
  return prisma.dailyReport.findMany({
    where: { projectId: id },
    orderBy: { date: "desc" },
    include: { photos: true, createdBy: true },
  });
}

export function getLabourData(id: string) {
  return Promise.all([
    prisma.worker.findMany({ where: { projectId: id }, orderBy: { name: "asc" } }),
    prisma.workerAttendance.findMany({ where: { projectId: id }, orderBy: { date: "desc" }, take: 60 }),
    prisma.workerPayment.findMany({ where: { projectId: id }, orderBy: { paymentDate: "desc" } }),
  ]);
}

export function getMaterialsData(id: string) {
  return Promise.all([
    prisma.inventory.findMany({ where: { projectId: id }, include: { material: true } }),
    prisma.inventoryTransaction.findMany({
      where: { projectId: id },
      orderBy: { date: "desc" },
      take: 30,
      include: { material: true },
    }),
    prisma.material.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ where: { id: { not: id } }, select: { id: true, name: true } }),
  ]);
}

export function getPurchasesData(id: string) {
  return prisma.purchase.findMany({
    where: { projectId: id },
    orderBy: { date: "desc" },
    include: { material: true, createdBy: true },
  });
}

export function getExpensesData(id: string) {
  return prisma.expense.findMany({ where: { projectId: id }, orderBy: { date: "desc" } });
}
