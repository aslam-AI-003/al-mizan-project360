import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedProjectOrRedirect } from "@/lib/supervisor-guard";
import { EmptyState } from "@/components/empty-state";
import { MaterialPurchaseForm } from "./purchase-form";

export default async function MaterialPurchasePage({ params }: PageProps<"/supervisor/projects/[id]/material-purchase">) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");
  const project = await getOwnedProjectOrRedirect(id, session.userId);

  const materials = await prisma.material.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Material Purchase</h2>
        <p className="text-sm text-black/50">{project.name}</p>
      </div>
      {materials.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Setup incomplete" description="No materials configured yet." />
      ) : (
        <MaterialPurchaseForm projectId={id} materials={materials} />
      )}
    </div>
  );
}
