import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { formatDate } from "@/lib/format";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get("project") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const attendance = await prisma.workerAttendance.findMany({
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
    include: { worker: { select: { name: true, workerCode: true } }, project: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  const rows = attendance.map((a) => [
    formatDate(a.date),
    a.worker.workerCode,
    a.worker.name,
    a.project.name,
    a.status,
    a.overtimeHours,
    a.wageAmount,
  ]);

  return csvResponse(
    "labour-attendance-report.csv",
    ["Date", "Worker Code", "Worker Name", "Project", "Status", "Overtime Hours", "Wage Amount"],
    rows
  );
}
