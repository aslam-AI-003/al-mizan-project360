import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { getDailyLedger } from "@/lib/project-costs";

export async function GET(_request: Request, ctx: RouteContext<"/admin/projects/[id]/ledger/download">) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id }, select: { name: true, budget: true } });
  if (!project) return new Response("Not found", { status: 404 });

  const days = await getDailyLedger(id, project.budget);
  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return csvResponse(
    `${slug}-budget-ledger.csv`,
    ["Date", "Labour", "Material", "Other", "Day Total", "Budget Remaining"],
    days.map((d) => [d.date, d.labour, d.material, d.other, d.total, d.remaining])
  );
}
