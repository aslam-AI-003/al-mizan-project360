import { prisma } from "@/lib/db";
import { todayRangeUTC } from "@/lib/date-range";
import { getSpendByProject } from "@/lib/project-costs";
import { ProjectStatus, Role } from "@prisma/client";

export async function getAdminDashboardData() {
  const today = todayRangeUTC();

  const [activeSupervisors, todaysAttendance, todaysExpenses, todaysPurchases, projects] = await Promise.all([
    prisma.user.count({ where: { role: Role.SUPERVISOR } }),
    prisma.workerAttendance.findMany({ where: { date: today }, select: { status: true, wageAmount: true } }),
    prisma.expense.aggregate({ where: { date: today }, _sum: { amount: true } }),
    prisma.purchase.aggregate({ where: { date: today }, _sum: { totalAmount: true } }),
    prisma.project.findMany({
      where: { archived: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, siteAddress: true, status: true, overallProgress: true, budget: true },
    }),
  ]);

  const spend = await getSpendByProject(projects.map((p) => p.id));
  const projectRows = projects.map((p) => {
    const spent = spend.get(p.id)!.total;
    return { ...p, spent, remaining: p.budget - spent };
  });

  const ongoingProjects = projectRows.filter((p) => p.status !== ProjectStatus.COMPLETED);
  const completedProjects = projectRows.filter((p) => p.status === ProjectStatus.COMPLETED);

  const todaysLabourCount = todaysAttendance.filter((a) => a.status !== "ABSENT").length;
  const todaysLabourCost = todaysAttendance.reduce((sum, a) => sum + a.wageAmount, 0);
  const todaysMaterialCost = todaysPurchases._sum.totalAmount ?? 0;
  const todaysOtherExpenses = todaysExpenses._sum.amount ?? 0;

  return {
    totalProjects: projectRows.length,
    ongoingCount: ongoingProjects.length,
    completedCount: completedProjects.length,
    delayedCount: projectRows.filter((p) => p.status === ProjectStatus.DELAYED).length,
    activeSupervisors,
    todaysLabourCount,
    todaysLabourCost,
    todaysMaterialCost,
    todaysOtherExpenses,
    todaysTotalSpending: todaysLabourCost + todaysMaterialCost + todaysOtherExpenses,
    ongoingProjects,
    completedProjects,
  };
}
