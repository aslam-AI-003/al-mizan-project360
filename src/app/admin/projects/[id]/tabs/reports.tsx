import type { BoqItem, Project } from "@prisma/client";
import { formatINR, titleCase } from "@/lib/format";
import { ProgressBar } from "@/components/progress-bar";

export function ReportsTab({
  project,
  boqItems,
  materialCost,
  labourCost,
  otherExpenses,
}: {
  project: Project;
  boqItems: BoqItem[];
  materialCost: number;
  labourCost: number;
  otherExpenses: number;
}) {
  const actualCost = materialCost + labourCost + otherExpenses;
  const grossProfit = project.contractValue - actualCost;
  const marginPct = project.contractValue > 0 ? Math.round((grossProfit / project.contractValue) * 100) : 0;
  const budgetUsedPct = project.budget > 0 ? Math.min(100, Math.round((actualCost / project.budget) * 100)) : 0;
  const overBudget = actualCost > project.budget;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-[var(--foreground)]">Project Profitability</h3>
          <div className="space-y-2.5 text-sm">
            <Row label="Contract Value (Revenue)" value={formatINR(project.contractValue)} />
            <Row label="Material Cost" value={`− ${formatINR(materialCost)}`} muted />
            <Row label="Labour Cost" value={`− ${formatINR(labourCost)}`} muted />
            <Row label="Other Expenses" value={`− ${formatINR(otherExpenses)}`} muted />
            <div className="my-2 h-px bg-black/5" />
            <Row label="Actual Project Cost" value={formatINR(actualCost)} />
            <Row
              label="Gross Profit"
              value={formatINR(grossProfit)}
              emphasize={grossProfit >= 0 ? "success" : "danger"}
            />
            <Row label="Profit Margin" value={`${marginPct}%`} emphasize={marginPct >= 0 ? "success" : "danger"} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-[var(--foreground)]">Budget vs Actual</h3>
          <div className="space-y-2.5 text-sm">
            <Row label="Budget" value={formatINR(project.budget)} />
            <Row label="Actual Spending" value={formatINR(actualCost)} />
            <Row
              label="Remaining Budget"
              value={formatINR(project.budget - actualCost)}
              emphasize={overBudget ? "danger" : "success"}
            />
          </div>
          <div className="mt-4">
            <ProgressBar value={budgetUsedPct} barClassName={overBudget ? "bg-[var(--status-danger)]" : undefined} />
            <p className="mt-1 text-right text-xs text-black/40">{budgetUsedPct}% of budget used</p>
          </div>
          {overBudget && (
            <p className="mt-3 rounded-lg bg-[var(--status-danger-bg)] px-3 py-2 text-xs font-medium text-[var(--status-danger)]">
              Spending has exceeded the approved budget for this project.
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Bill of Quantities (BOQ)</h3>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs text-black/40">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Est. Qty</th>
                <th className="px-4 py-3">Est. Cost</th>
                <th className="px-4 py-3">Actual Qty</th>
                <th className="px-4 py-3">Actual Cost</th>
                <th className="px-4 py-3">Variance</th>
              </tr>
            </thead>
            <tbody>
              {boqItems.map((item) => {
                const variance = item.estimatedCost - item.actualCost;
                return (
                  <tr key={item.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{item.itemName}</td>
                    <td className="px-4 py-3 text-black/50">{titleCase(item.category)}</td>
                    <td className="px-4 py-3">{item.estimatedQty.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{formatINR(item.estimatedCost)}</td>
                    <td className="px-4 py-3">{item.actualQty.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{formatINR(item.actualCost)}</td>
                    <td className={`px-4 py-3 font-medium ${variance < 0 ? "text-[var(--status-danger)]" : "text-[var(--status-success)]"}`}>
                      {variance < 0 ? "−" : "+"}{formatINR(Math.abs(variance))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  emphasize,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasize?: "success" | "danger";
}) {
  const valueClass = emphasize
    ? emphasize === "success"
      ? "text-[var(--status-success)] font-bold"
      : "text-[var(--status-danger)] font-bold"
    : muted
      ? "text-black/50"
      : "font-semibold text-[var(--foreground)]";

  return (
    <div className="flex items-center justify-between">
      <span className="text-black/50">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
