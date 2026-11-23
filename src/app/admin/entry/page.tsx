import Link from "next/link";
import { Building2, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { dayRange, isDayKey, todayKey } from "@/lib/date-range";
import { getSpendByProject } from "@/lib/project-costs";
import { EmptyState } from "@/components/empty-state";
import { EntryPicker } from "./entry-picker";
import { DailyEntryForm, type InitialEntry } from "./entry-form";

export default async function DailyEntryPage(props: PageProps<"/admin/entry">) {
  const sp = await props.searchParams;
  const projectParam = typeof sp.project === "string" ? sp.project : "";
  const dateParam = typeof sp.date === "string" ? sp.date : "";
  const saved = sp.saved === "1";

  const projects = await prisma.project.findMany({
    where: { archived: false },
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, name: true, status: true, budget: true, overallProgress: true },
  });

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No projects yet"
        description="Create a project first, then add daily entries to it."
      />
    );
  }

  const project =
    projects.find((p) => p.id === projectParam) ?? projects.find((p) => p.status !== "COMPLETED") ?? projects[0];
  const date = isDayKey(dateParam) ? dateParam : todayKey();
  const range = dayRange(date);
  const onDay = { projectId: project.id, date: range };

  const [labour, purchases, usage, expenses, materials, suppliers, stock, totalSpend, daySpend] = await Promise.all([
    prisma.labourEntry.findMany({ where: onDay, orderBy: { createdAt: "asc" } }),
    prisma.purchase.findMany({ where: onDay, orderBy: { createdAt: "asc" }, include: { material: true, supplier: true } }),
    prisma.inventoryTransaction.findMany({ where: { ...onDay, type: "USAGE" }, include: { material: true } }),
    prisma.expense.findMany({ where: onDay, orderBy: { createdAt: "asc" } }),
    prisma.material.findMany({ orderBy: { name: "asc" }, select: { name: true, unit: true } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.inventory.findMany({ where: { projectId: project.id }, include: { material: true } }),
    getSpendByProject([project.id]),
    getSpendByProject([project.id], range),
  ]);

  const spentBeforeThisDay = totalSpend.get(project.id)!.total - daySpend.get(project.id)!.total;

  const initial: InitialEntry = {
    progress: project.overallProgress,
    labour: labour.map((l) => ({ id: l.id, workers: String(l.workers), amount: String(l.amount), note: l.note ?? "" })),
    purchases: purchases.map((p) => ({
      id: p.id,
      material: p.material.name,
      unit: p.unit,
      quantity: String(p.quantity),
      rate: String(p.rate),
      supplier: p.supplier?.name ?? p.vendorName ?? "",
    })),
    usage: usage.map((u) => ({ material: u.material.name, quantity: String(u.quantity) })),
    expenses: expenses.map((e) => ({ id: e.id, category: e.category, amount: String(e.amount), note: e.description })),
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Daily Entry</h2>
          <p className="text-sm text-black/50">Record the day&apos;s labour, materials and other spending.</p>
        </div>
        <Link href={`/admin/projects/${project.id}?tab=ledger`} className="text-xs font-semibold text-brand-navy">
          View ledger →
        </Link>
      </div>

      <EntryPicker projects={projects.map((p) => ({ id: p.id, name: p.name }))} projectId={project.id} date={date} />

      {saved && (
        <p className="flex items-center gap-2 rounded-xl bg-[var(--status-success-bg)] px-4 py-3 text-sm font-medium text-[var(--status-success)]">
          <CheckCircle2 size={16} /> Saved.
        </p>
      )}

      <DailyEntryForm
        key={`${project.id}:${date}`}
        projectId={project.id}
        date={date}
        budget={project.budget}
        spentBeforeThisDay={spentBeforeThisDay}
        initial={initial}
        materials={materials}
        suppliers={suppliers.map((s) => s.name)}
        stock={stock.map((s) => ({ name: s.material.name, unit: s.material.unit, inStock: s.currentStock }))}
      />
    </div>
  );
}
