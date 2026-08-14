import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedProjectOrRedirect } from "@/lib/supervisor-guard";
import { logUsage } from "./actions";

export default async function MaterialsPage({ params }: PageProps<"/supervisor/projects/[id]/materials">) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");
  const project = await getOwnedProjectOrRedirect(id, session.userId);

  const inventory = await prisma.inventory.findMany({
    where: { projectId: id },
    include: { material: true },
    orderBy: { material: { name: "asc" } },
  });

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Material Usage</h2>
        <p className="text-sm text-black/50">{project.name}</p>
      </div>

      {inventory.length === 0 ? (
        <p className="card p-4 text-sm text-black/40">No inventory has been set up for this project yet.</p>
      ) : (
        <form action={logUsage} className="card space-y-3 p-4">
          <input type="hidden" name="projectId" value={id} />
          <div>
            <label className="label">Material</label>
            <select name="materialId" required className="select">
              {inventory.map((inv) => (
                <option key={inv.materialId} value={inv.materialId}>
                  {inv.material.name} ({inv.currentStock} {inv.material.unit} in stock)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Quantity Used</label>
            <input type="number" name="quantity" min="0.01" step="0.01" required className="input" placeholder="e.g. 25" />
          </div>
          <button type="submit" className="btn-primary w-full">Log Usage</button>
        </form>
      )}

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Current Stock</h3>
        <div className="card divide-y divide-black/5">
          {inventory.map((inv) => {
            const low = inv.currentStock <= inv.lowStockAt;
            return (
              <div key={inv.id} className="flex items-center justify-between gap-3 p-3.5">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{inv.material.name}</p>
                  <p className="text-xs text-black/40">{inv.currentStock} {inv.material.unit} available</p>
                </div>
                {low && (
                  <span className="badge bg-[var(--status-danger-bg)] text-[var(--status-danger)]">
                    <AlertTriangle size={12} /> Low stock
                  </span>
                )}
              </div>
            );
          })}
          {inventory.length === 0 && <p className="p-4 text-sm text-black/40">No inventory records for this project.</p>}
        </div>
      </div>
    </div>
  );
}
