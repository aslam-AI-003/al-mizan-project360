import { prisma } from "@/lib/db";

/**
 * Single source of truth for project spending. Every screen that shows money
 * spent or budget remaining must use these helpers so the numbers always match.
 *
 *   Labour   = daily labour entries (LabourEntry.amount)
 *   Material = materials bought for the site (Purchase.totalAmount), paid or not
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
export async function getSpendByProject(
  projectIds: string[],
  dateFilter?: { gte: Date; lt: Date }
): Promise<Map<string, SpendBreakdown>> {
  const where = { projectId: { in: projectIds }, ...(dateFilter ? { date: dateFilter } : {}) };
  const [labour, material, other] = await Promise.all([
    prisma.labourEntry.groupBy({ by: ["projectId"], where, _sum: { amount: true } }),
    prisma.purchase.groupBy({ by: ["projectId"], where, _sum: { totalAmount: true } }),
    prisma.expense.groupBy({ by: ["projectId"], where, _sum: { amount: true } }),
  ]);

  const result = new Map<string, SpendBreakdown>(
    projectIds.map((id) => [id, { labour: 0, material: 0, other: 0, total: 0 }])
  );
  for (const row of labour) result.get(row.projectId)!.labour = row._sum.amount ?? 0;
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
  const [labour, purchases, expenses] = await Promise.all([
    prisma.labourEntry.findMany({ where: { projectId }, select: { date: true, amount: true } }),
    prisma.purchase.findMany({ where: { projectId }, select: { date: true, totalAmount: true } }),
    prisma.expense.findMany({ where: { projectId }, select: { date: true, amount: true } }),
  ]);

  const days = new Map<string, { labour: number; material: number; other: number }>();
  const bucket = (d: Date) => {
    const key = dayKey(d);
    let entry = days.get(key);
    if (!entry) {
      entry = { labour: 0, material: 0, other: 0 };
      days.set(key, entry);
    }
    return entry;
  };

  for (const l of labour) bucket(l.date).labour += l.amount;
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

export type MaterialSummary = {
  materialId: string;
  name: string;
  unit: string;
  bought: number;
  used: number;
  inStock: number;
  cost: number;
};

/** Per-material bought / used / in stock / cost for one project. */
export async function getMaterialSummary(projectId: string): Promise<MaterialSummary[]> {
  const [inventory, txns, purchases] = await Promise.all([
    prisma.inventory.findMany({ where: { projectId }, include: { material: true } }),
    prisma.inventoryTransaction.groupBy({ by: ["materialId", "type"], where: { projectId }, _sum: { quantity: true } }),
    prisma.purchase.groupBy({ by: ["materialId"], where: { projectId }, _sum: { totalAmount: true } }),
  ]);

  const costBy = new Map(purchases.map((p) => [p.materialId, p._sum.totalAmount ?? 0]));
  const qty = (materialId: string, types: string[]) =>
    txns.filter((t) => t.materialId === materialId && types.includes(t.type)).reduce((s, t) => s + (t._sum.quantity ?? 0), 0);

  return inventory
    .map((inv) => ({
      materialId: inv.materialId,
      name: inv.material.name,
      unit: inv.material.unit,
      bought: qty(inv.materialId, ["OPENING", "PURCHASE", "TRANSFER_IN"]),
      used: qty(inv.materialId, ["USAGE", "TRANSFER_OUT"]),
      inStock: inv.currentStock,
      cost: costBy.get(inv.materialId) ?? 0,
    }))
    .filter((m) => m.bought > 0 || m.used > 0 || m.cost > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type SupplierBalance = {
  id: string;
  name: string;
  phone: string | null;
  bought: number;
  paid: number;
  pending: number;
};

/** Every supplier with total bought (all projects), paid and pending. Biggest pending first. */
export async function getSupplierBalances(): Promise<SupplierBalance[]> {
  const [suppliers, bought, paid] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.purchase.groupBy({ by: ["supplierId"], where: { supplierId: { not: null } }, _sum: { totalAmount: true } }),
    prisma.supplierPayment.groupBy({ by: ["supplierId"], _sum: { amount: true } }),
  ]);
  const boughtBy = new Map(bought.map((b) => [b.supplierId!, b._sum.totalAmount ?? 0]));
  const paidBy = new Map(paid.map((p) => [p.supplierId, p._sum.amount ?? 0]));

  return suppliers
    .map((s) => {
      const b = boughtBy.get(s.id) ?? 0;
      const p = paidBy.get(s.id) ?? 0;
      return { id: s.id, name: s.name, phone: s.phone, bought: b, paid: p, pending: b - p };
    })
    .sort((a, b) => b.pending - a.pending || a.name.localeCompare(b.name));
}
