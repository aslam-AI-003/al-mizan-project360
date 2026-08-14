import { prisma } from "@/lib/db";
import { todayRangeUTC } from "@/lib/date-range";
import { ProjectStatus, Role } from "@prisma/client";

export async function getAdminDashboardData() {
  const today = todayRangeUTC();

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    delayedProjects,
    totalClients,
    activeSupervisors,
    todaysAttendance,
    todaysExpenses,
    todaysPurchases,
    pendingApprovals,
    projects,
    supplierPayments,
    lowStockInventory,
    recentPhotos,
  ] = await Promise.all([
    prisma.project.count({ where: { archived: false } }),
    prisma.project.count({ where: { status: { in: [ProjectStatus.STARTED, ProjectStatus.IN_PROGRESS] }, archived: false } }),
    prisma.project.count({ where: { status: ProjectStatus.COMPLETED, archived: false } }),
    prisma.project.count({ where: { status: ProjectStatus.DELAYED, archived: false } }),
    prisma.user.count({ where: { role: Role.CLIENT } }),
    prisma.user.count({ where: { role: Role.SUPERVISOR } }),
    prisma.workerAttendance.findMany({ where: { date: today } }),
    prisma.expense.aggregate({ where: { date: today }, _sum: { amount: true } }),
    prisma.purchase.aggregate({ where: { createdAt: today }, _sum: { totalAmount: true } }),
    prisma.approval.count({ where: { status: "PENDING" } }),
    prisma.project.findMany({
      where: { archived: false },
      select: { contractValue: true, clientPayments: { select: { amount: true } } },
    }),
    prisma.supplierPayment.aggregate({ _sum: { invoiceAmount: true, paidAmount: true } }),
    prisma.inventory.findMany({ select: { currentStock: true, lowStockAt: true } }),
    prisma.projectPhoto.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { project: { select: { name: true } } },
    }),
  ]);

  const todaysLabourCount = todaysAttendance.filter((a) => a.status !== "ABSENT").length;
  const todaysLabourCost = todaysAttendance.reduce((sum, a) => sum + a.wageAmount, 0);
  const todaysMaterialPurchase = todaysPurchases._sum.totalAmount ?? 0;
  const todaysOtherExpenses = todaysExpenses._sum.amount ?? 0;

  const pendingClientPayments = projects.reduce((sum, p) => {
    const paid = p.clientPayments.reduce((s, cp) => s + cp.amount, 0);
    return sum + Math.max(0, p.contractValue - paid);
  }, 0);

  const supplierOutstanding = Math.max(
    0,
    (supplierPayments._sum.invoiceAmount ?? 0) - (supplierPayments._sum.paidAmount ?? 0)
  );

  const lowStockCount = lowStockInventory.filter((inv) => inv.currentStock <= inv.lowStockAt).length;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    delayedProjects,
    totalClients,
    activeSupervisors,
    todaysLabourCount,
    todaysLabourCost,
    todaysMaterialPurchase,
    todaysOtherExpenses,
    todaysTotalSpending: todaysLabourCost + todaysMaterialPurchase + todaysOtherExpenses,
    pendingApprovals,
    pendingClientPayments,
    supplierOutstanding,
    lowStockCount,
    recentPhotos,
  };
}
