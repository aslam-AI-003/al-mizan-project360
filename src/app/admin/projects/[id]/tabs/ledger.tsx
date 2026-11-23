import Link from "next/link";
import { Download, BookOpen } from "lucide-react";
import type { Project } from "@prisma/client";
import type { LedgerDay, SpendBreakdown } from "@/lib/project-costs";
import { formatDate, formatINR } from "@/lib/format";
import { ProgressBar } from "@/components/progress-bar";
import { EmptyState } from "@/components/empty-state";

export function LedgerTab({ project, spend, days }: { project: Project; spend: SpendBreakdown; days: LedgerDay[] }) {
  const remaining = project.budget - spend.total;
  const overBudget = remaining < 0;
  const usedPct = project.budget > 0 ? Math.min(100, Math.round((spend.total / project.budget) * 100)) : 0;
  // Newest day first for reading; running balance was computed oldest-first.
  const rows = [...days].reverse();

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Figure label="Budget" value={project.budget} />
          <Figure label="Labour" value={spend.labour} />
          <Figure label="Material" value={spend.material} />
          <Figure label="Other Expenses" value={spend.other} />
          <Figure label="Remaining" value={remaining} tone={overBudget ? "danger" : "success"} />
        </div>
        <div className="mt-4">
          <ProgressBar value={usedPct} barClassName={overBudget ? "bg-[var(--status-danger)]" : undefined} />
          <p className="mt-1 text-right text-xs text-black/40">
            {formatINR(spend.total)} spent · {usedPct}% of budget used
          </p>
        </div>
        {overBudget && (
          <p className="mt-3 rounded-lg bg-[var(--status-danger-bg)] px-3 py-2 text-xs font-medium text-[var(--status-danger)]">
            Spending has exceeded the budget for this project by {formatINR(-remaining)}.
          </p>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Day-by-Day Ledger</h3>
          {days.length > 0 && (
            <a href={`/admin/projects/${project.id}/ledger/download`} className="btn-outline btn-sm">
              <Download size={14} /> CSV
            </a>
          )}
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={BookOpen} title="No spending yet" description="Add a Daily Entry and it will appear here." />
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs text-black/40">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Labour</th>
                  <th className="px-4 py-3 text-right">Material</th>
                  <th className="px-4 py-3 text-right">Other</th>
                  <th className="px-4 py-3 text-right">Day Total</th>
                  <th className="px-4 py-3 text-right">Budget Remaining</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.date} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/entry?project=${project.id}&date=${d.date}`} className="text-brand-navy hover:underline">
                        {formatDate(new Date(d.date))}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-black/70">{formatINR(d.labour)}</td>
                    <td className="px-4 py-3 text-right text-black/70">{formatINR(d.material)}</td>
                    <td className="px-4 py-3 text-right text-black/70">{formatINR(d.other)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--foreground)]">{formatINR(d.total)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${d.remaining < 0 ? "text-[var(--status-danger)]" : "text-[var(--status-success)]"}`}>
                      {formatINR(d.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Figure({ label, value, tone }: { label: string; value: number; tone?: "success" | "danger" }) {
  const color =
    tone === "danger" ? "text-[var(--status-danger)]" : tone === "success" ? "text-[var(--status-success)]" : "text-[var(--foreground)]";
  return (
    <div>
      <p className="text-xs text-black/50">{label}</p>
      <p className={`text-base font-bold ${color}`}>{formatINR(value)}</p>
    </div>
  );
}
