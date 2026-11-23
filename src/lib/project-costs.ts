import { prisma } from "@/lib/db";

/**
 * Single source of truth for project spending. Every screen that shows money
 * spent or budget remaining must use these helpers so the numbers always match.
 *
 *   Labour   = wages earned, from daily attendance (WorkerAttendance.wageAmount)
 *   Material = materials bought for the site (Purchase.totalAmount)
 *   Other    = site expenses (Expense.amount)
 */

export type SpendBreakdown = { labour: number; material: number; other: number; total: number };

export type LedgerDay = SpendBreakdown & {
  /** YYYY-MM-DD (UTC) */
  date: string;
  /** Budget left after this day's spending. */
  remaining: number;
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Total spend per project, keyed by project id. Projects with no spend get zeros. */
export async function getSpendByProject(projectIds: string[]): Promise<Map<string, SpendBreakdown>> {
  const where = { projectId: { in: projectIds } };
  const [labour, material, other] = await Promise.all([
    prisma.workerAttendance.groupBy({ by: ["projectId"], where, _sum: { wageAmount: true } }),
    prisma.purchase.groupBy({ by: ["projectId"], where, _sum: { totalAmount: true } }),
    prisma.expense.groupBy({ by: ["projectId"], where, _sum: { amount: true } }),
  ]);

  const result = new Map<string, SpendBreakdown>(
    projectIds.map((id) => [id, { labour: 0, material: 0, other: 0, total: 0 }])
  );
  for (const row of labour) result.get(row.projectId)!.labour = row._sum.wageAmount ?? 0;
  for (const row of material) result.get(row.projectId)!.material = row._sum.totalAmount ?? 0;
  for (const row of other) result.get(row.projectId)!.other = row._sum.amount ?? 0;
  for (const spend of result.values()) spend.total = spend.labour + spend.material + spend.other;
  return result;
}

export async function getProjectSpend(projectId: string): Promise<SpendBreakdown> {
  return (await getSpendByProject([projectId])).get(projectId)!;
}

/**
 * Day-by-day spending for one project, oldest first, with the running budget
 * remaining after each day. Only days with some spending are included.
 */
export async function getDailyLedger(projectId: string, budget: number): Promise<LedgerDay[]> {
  const [attendance, purchases, expenses] = await Promise.all([
    prisma.workerAttendance.findMany({ where: { projectId }, select: { date: true, wageAmount: true } }),
    prisma.purchase.findMany({ where: { projectId }, select: { date: true, totalAmount: true } }),
    prisma.expense.findMany({ where: { projectId }, select: { date: true, amount: true } }),
  ]);

  const days = new Map<string, SpendBreakdown>();
  const bucket = (d: Date) => {
    const key = dayKey(d);
    let entry = days.get(key);
    if (!entry) {
      entry = { labour: 0, material: 0, other: 0, total: 0 };
      days.set(key, entry);
    }
    return entry;
  };

  for (const a of attendance) bucket(a.date).labour += a.wageAmount;
  for (const p of purchases) bucket(p.date).material += p.totalAmount;
  for (const e of expenses) bucket(e.date).other += e.amount;

  let remaining = budget;
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, d]) => d.labour + d.material + d.other > 0)
    .map(([date, d]) => {
      const total = d.labour + d.material + d.other;
      remaining -= total;
      return { date, labour: d.labour, material: d.material, other: d.other, total, remaining };
    });
}
