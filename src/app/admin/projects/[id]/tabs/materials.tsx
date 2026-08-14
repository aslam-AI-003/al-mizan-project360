import type { Inventory, InventoryTransaction, Material, Project } from "@prisma/client";
import { formatDateShort, titleCase } from "@/lib/format";
import { transferMaterial } from "../actions";
import { AlertTriangle } from "lucide-react";

type InventoryWithMaterial = Inventory & { material: Material };
type TxnWithMaterial = InventoryTransaction & { material: Material };

export function MaterialsTab({
  projectId,
  inventory,
  transactions,
  materials,
  otherProjects,
}: {
  projectId: string;
  inventory: InventoryWithMaterial[];
  transactions: TxnWithMaterial[];
  materials: Material[];
  otherProjects: Pick<Project, "id" | "name">[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {inventory.map((inv) => {
          const low = inv.currentStock <= inv.lowStockAt;
          return (
            <div key={inv.id} className={`card p-3.5 ${low ? "border-[var(--status-danger)]/30" : ""}`}>
              <p className="text-xs text-black/50">{inv.material.name}</p>
              <p className="text-lg font-bold text-[var(--foreground)]">
                {inv.currentStock} <span className="text-xs font-normal text-black/40">{inv.material.unit}</span>
              </p>
              {low && (
                <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[var(--status-danger)]">
                  <AlertTriangle size={11} /> Low stock
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Recent Transactions</h3>
          <div className="card divide-y divide-black/5">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{t.material.name}</p>
                  <p className="text-xs text-black/40">{titleCase(t.type)} · {formatDateShort(t.date)}</p>
                </div>
                <p className={`font-semibold ${["USAGE", "TRANSFER_OUT"].includes(t.type) ? "text-[var(--status-danger)]" : "text-[var(--status-success)]"}`}>
                  {["USAGE", "TRANSFER_OUT"].includes(t.type) ? "−" : "+"}{t.quantity} {t.material.unit}
                </p>
              </div>
            ))}
            {transactions.length === 0 && <p className="p-4 text-sm text-black/40">No transactions yet.</p>}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Transfer Material to Another Site</h3>
          <form action={transferMaterial} className="card space-y-3 p-4">
            <input type="hidden" name="projectId" value={projectId} />
            <div>
              <label className="label">Material</label>
              <select name="materialId" required className="select">
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Quantity</label>
              <input type="number" name="quantity" min={1} required className="input" />
            </div>
            <div>
              <label className="label">Transfer To</label>
              <select name="toProjectId" required className="select">
                {otherProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">Transfer Material</button>
          </form>
        </div>
      </div>
    </div>
  );
}
