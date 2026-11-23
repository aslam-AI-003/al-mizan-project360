import { Boxes } from "lucide-react";
import type { MaterialSummary } from "@/lib/project-costs";
import { formatINR } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

const qty = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export function MaterialsTab({ materials }: { materials: MaterialSummary[] }) {
  if (materials.length === 0) {
    return <EmptyState icon={Boxes} title="No materials yet" description="Materials bought in the Daily Entry will appear here." />;
  }
  const totalCost = materials.reduce((s, m) => s + m.cost, 0);

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/5 text-left text-xs text-black/40">
            <th className="px-4 py-3">Material</th>
            <th className="px-4 py-3 text-right">Bought</th>
            <th className="px-4 py-3 text-right">Used</th>
            <th className="px-4 py-3 text-right">In Stock</th>
            <th className="px-4 py-3 text-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.materialId} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-3 font-medium">{m.name}</td>
              <td className="px-4 py-3 text-right text-black/70">{qty(m.bought)} {m.unit}</td>
              <td className="px-4 py-3 text-right text-black/70">{qty(m.used)} {m.unit}</td>
              <td className={`px-4 py-3 text-right font-semibold ${m.inStock < 0 ? "text-[var(--status-danger)]" : ""}`}>
                {qty(m.inStock)} {m.unit}
              </td>
              <td className="px-4 py-3 text-right font-semibold">{formatINR(m.cost)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-black/10">
            <td className="px-4 py-3 font-bold" colSpan={4}>Total material cost</td>
            <td className="px-4 py-3 text-right font-bold">{formatINR(totalCost)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
