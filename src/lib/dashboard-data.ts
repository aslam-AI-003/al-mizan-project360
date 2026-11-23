import { prisma } from "@/lib/db";
import { todayRangeUTC } from "@/lib/date-range";
import { getSpendByProject, getSupplierBalances } from "@/lib/project-costs";

export async function getHomeData() {
  const projects = await prisma.project.findMany({
    where: { archived: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, siteAddress: true, clientName: true, status: true, overallProgress: true, budget: true },
  });
  const ids = projects.map((p) => p.id);

  const [allTime, today, suppliers] = await Promise.all([
    getSpendByProject(ids),
    getSpendByProject(ids, todayRangeUTC()),
    getSupplierBalances(),
  ]);

  const rows = projects.map((p) => {
    const spent = allTime.get(p.id)!.total;
    return { ...p, spent, balance: p.budget - spent, today: today.get(p.id)! };
  });

  const sum = (pick: (s: { labour: number; material: number; other: number; total: number }) => number) =>
    [...today.values()].reduce((s, t) => s + pick(t), 0);

  return {
    ongoing: rows.filter((p) => p.status !== "COMPLETED"),
    completed: rows.filter((p) => p.status === "COMPLETED"),
    today: { labour: sum((t) => t.labour), material: sum((t) => t.material), other: sum((t) => t.other), total: sum((t) => t.total) },
    supplierPending: suppliers.reduce((s, x) => s + Math.max(0, x.pending), 0),
  };
}

export type HomeProject = Awaited<ReturnType<typeof getHomeData>>["ongoing"][number];
