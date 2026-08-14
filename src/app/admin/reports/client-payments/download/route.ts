import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { formatDate, titleCase } from "@/lib/format";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get("project") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const payments = await prisma.clientPayment.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { project: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  const rows = payments.map((p) => [
    formatDate(p.date),
    p.project.name,
    p.amount,
    titleCase(p.mode),
    p.referenceNumber ?? "",
    p.remarks ?? "",
  ]);

  return csvResponse(
    "client-payments-report.csv",
    ["Date", "Project", "Amount", "Mode", "Reference Number", "Remarks"],
    rows
  );
}
