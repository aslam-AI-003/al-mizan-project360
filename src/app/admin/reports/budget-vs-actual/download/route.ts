import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, budget: true },
  });

  const rows = await Promise.all(
    projects.map(async (project) => {
      const [expenses, workerPayments, purchases] = await Promise.all([
        prisma.expense.aggregate({ where: { projectId: project.id }, _sum: { amount: true } }),
        prisma.workerPayment.aggregate({ where: { projectId: project.id }, _sum: { amount: true } }),
        prisma.purchase.aggregate({ where: { projectId: project.id }, _sum: { totalAmount: true } }),
      ]);
      const actual =
        (expenses._sum.amount ?? 0) + (workerPayments._sum.amount ?? 0) + (purchases._sum.totalAmount ?? 0);
      return [project.name, project.budget, actual, project.budget - actual];
    })
  );

  return csvResponse("budget-vs-actual-report.csv", ["Project", "Budget", "Actual Spend", "Variance"], rows);
}
