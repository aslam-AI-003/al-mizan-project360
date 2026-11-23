"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ExpenseCategory, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/owner-guard";
import { dayRange, isDayKey } from "@/lib/date-range";

const text = (max: number) => z.string().trim().max(max, `must be ${max} characters or fewer`);
const positive = z.coerce.number({ error: "must be a number" }).positive("must be more than 0");

const EntrySchema = z.object({
  projectId: z.string().min(1),
  date: z.string().refine(isDayKey, "Invalid date"),
  progress: z.coerce.number().int().min(0, "must be 0–100").max(100, "must be 0–100").nullable(),
  labour: z.array(
    z.object({
      id: z.string().optional(),
      workers: z.coerce.number().int("must be a whole number").min(0, "cannot be negative").max(10000),
      amount: positive,
      note: text(200),
    })
  ),
  purchases: z.array(
    z.object({
      id: z.string().optional(),
      material: text(100).min(1, "is required"),
      unit: text(30).min(1, "is required"),
      quantity: positive,
      rate: positive,
      supplier: text(100),
    })
  ),
  usage: z.array(
    z.object({
      material: text(100).min(1, "is required"),
      quantity: positive,
    })
  ),
  expenses: z.array(
    z.object({
      id: z.string().optional(),
      category: z.enum(ExpenseCategory),
      amount: positive,
      note: text(200),
    })
  ),
});

/** What the Daily Entry form sends (as JSON in the "payload" field). */
export type DailyEntryPayload = {
  projectId: string;
  date: string;
  progress: number | null;
  labour: { id?: string; workers: number; amount: number; note: string }[];
  purchases: { id?: string; material: string; unit: string; quantity: number; rate: number; supplier: string }[];
  usage: { material: string; quantity: number }[];
  expenses: { id?: string; category: ExpenseCategory; amount: number; note: string }[];
};
export type SaveState = { error?: string } | null;

type Tx = Prisma.TransactionClient;

const SECTION_NAMES: Record<string, string> = {
  labour: "Labour",
  purchases: "Materials Bought",
  usage: "Materials Used",
  expenses: "Other Expenses",
};
const FIELD_NAMES: Record<string, string> = {
  workers: "Workers",
  amount: "Amount",
  note: "Note",
  material: "Material",
  unit: "Unit",
  quantity: "Qty",
  rate: "Rate",
  supplier: "Supplier",
  category: "Type",
  progress: "Project progress",
  date: "Date",
};

/** Turns a validation issue into e.g. "Materials Bought, row 2: Rate must be more than 0." */
function describeIssue(issue: z.core.$ZodIssue) {
  const [section, row, field] = issue.path.map(String);
  if (SECTION_NAMES[section] && row !== undefined) {
    return `${SECTION_NAMES[section]}, row ${Number(row) + 1}: ${FIELD_NAMES[field] ?? field} ${issue.message}.`;
  }
  return `${FIELD_NAMES[section] ?? "Form"} ${issue.message}.`;
}

async function findOrCreateMaterial(tx: Tx, name: string, unit: string) {
  const existing = await tx.material.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  return existing ?? tx.material.create({ data: { name, unit, category: "General" } });
}

async function findOrCreateSupplier(tx: Tx, name: string) {
  const existing = await tx.supplier.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  return existing ?? tx.supplier.create({ data: { name } });
}

/** Keep only rows whose id really belongs to this project + day; anything else is treated as new. */
function ownedId(id: string | undefined, owned: Set<string>) {
  return id && owned.has(id) ? id : undefined;
}

/**
 * Saves the whole Daily Entry for one project and one day. The form always
 * sends the complete day, so rows missing from the payload are deleted.
 */
export async function saveDailyEntry(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const session = await requireOwner();

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Could not read the form. Please try again." };
  }
  const parsed = EntrySchema.safeParse(raw);
  if (!parsed.success) return { error: describeIssue(parsed.error.issues[0]) };
  const entry = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: entry.projectId } });
  if (!project || project.archived) return { error: "Project not found." };

  const range = dayRange(entry.date);
  const day = range.gte;
  const onDay = { projectId: project.id, date: range };

  await prisma.$transaction(
    async (tx) => {
      // ---- Labour ----
      const oldLabour = new Set((await tx.labourEntry.findMany({ where: onDay, select: { id: true } })).map((r) => r.id));
      const keepLabour = entry.labour.map((r) => ownedId(r.id, oldLabour)).filter(Boolean) as string[];
      await tx.labourEntry.deleteMany({ where: { ...onDay, id: { notIn: keepLabour } } });
      for (const row of entry.labour) {
        const data = { workers: row.workers, amount: row.amount, note: row.note || null };
        const id = ownedId(row.id, oldLabour);
        if (id) await tx.labourEntry.update({ where: { id }, data });
        else await tx.labourEntry.create({ data: { ...data, projectId: project.id, date: day } });
      }

      // ---- Material purchases ----
      const oldPurchases = await tx.purchase.findMany({ where: onDay, select: { id: true, materialId: true } });
      const oldPurchaseIds = new Set(oldPurchases.map((p) => p.id));
      const keepPurchases = entry.purchases.map((r) => ownedId(r.id, oldPurchaseIds)).filter(Boolean) as string[];
      await tx.purchase.deleteMany({ where: { ...onDay, id: { notIn: keepPurchases } } });

      const affectedMaterials = new Set<string>(oldPurchases.map((p) => p.materialId));
      const stockTxns: Prisma.InventoryTransactionCreateManyInput[] = [];

      for (const row of entry.purchases) {
        const material = await findOrCreateMaterial(tx, row.material, row.unit);
        const supplier = row.supplier ? await findOrCreateSupplier(tx, row.supplier) : null;
        const data = {
          materialId: material.id,
          supplierId: supplier?.id ?? null,
          quantity: row.quantity,
          unit: row.unit,
          rate: row.rate,
          totalAmount: Math.round(row.quantity * row.rate * 100) / 100,
        };
        const id = ownedId(row.id, oldPurchaseIds);
        if (id) await tx.purchase.update({ where: { id }, data });
        else await tx.purchase.create({ data: { ...data, projectId: project.id, date: day, createdById: session.userId } });
        affectedMaterials.add(material.id);
        stockTxns.push({ projectId: project.id, materialId: material.id, type: "PURCHASE", quantity: row.quantity, date: day });
      }

      // ---- Material used ----
      for (const row of entry.usage) {
        const material = await findOrCreateMaterial(tx, row.material, "unit");
        affectedMaterials.add(material.id);
        stockTxns.push({ projectId: project.id, materialId: material.id, type: "USAGE", quantity: row.quantity, date: day });
      }

      // Rebuild this day's stock movements from the form, then recompute stock for every material touched.
      const oldStockTxns = await tx.inventoryTransaction.findMany({
        where: { ...onDay, type: { in: ["PURCHASE", "USAGE"] } },
        select: { materialId: true },
      });
      for (const t of oldStockTxns) affectedMaterials.add(t.materialId);
      await tx.inventoryTransaction.deleteMany({ where: { ...onDay, type: { in: ["PURCHASE", "USAGE"] } } });
      if (stockTxns.length) await tx.inventoryTransaction.createMany({ data: stockTxns });

      for (const materialId of affectedMaterials) {
        const sums = await tx.inventoryTransaction.groupBy({
          by: ["type"],
          where: { projectId: project.id, materialId },
          _sum: { quantity: true },
        });
        const stock = sums.reduce((total, s) => {
          const q = s._sum.quantity ?? 0;
          return ["USAGE", "TRANSFER_OUT"].includes(s.type) ? total - q : total + q;
        }, 0);
        await tx.inventory.upsert({
          where: { projectId_materialId: { projectId: project.id, materialId } },
          create: { projectId: project.id, materialId, currentStock: stock },
          update: { currentStock: stock },
        });
      }

      // ---- Other expenses ----
      const oldExpenses = new Set((await tx.expense.findMany({ where: onDay, select: { id: true } })).map((r) => r.id));
      const keepExpenses = entry.expenses.map((r) => ownedId(r.id, oldExpenses)).filter(Boolean) as string[];
      await tx.expense.deleteMany({ where: { ...onDay, id: { notIn: keepExpenses } } });
      for (const row of entry.expenses) {
        const data = { category: row.category, amount: row.amount, description: row.note || row.category.replace("_", " ").toLowerCase() };
        const id = ownedId(row.id, oldExpenses);
        if (id) await tx.expense.update({ where: { id }, data });
        else
          await tx.expense.create({
            data: { ...data, projectId: project.id, date: day, paidBy: session.name, paymentMode: "CASH", createdById: session.userId },
          });
      }

      // ---- Progress ----
      if (entry.progress !== null && entry.progress !== project.overallProgress) {
        await tx.project.update({ where: { id: project.id }, data: { overallProgress: entry.progress } });
      }
    },
    { timeout: 30000, maxWait: 10000 }
  );

  revalidatePath("/admin", "layout");
  redirect(`/admin/entry?project=${project.id}&date=${entry.date}&saved=1`);
}
