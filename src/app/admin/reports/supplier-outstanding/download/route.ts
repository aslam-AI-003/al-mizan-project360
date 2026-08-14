import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { payments: { select: { invoiceAmount: true, paidAmount: true } } },
  });

  const rows = suppliers.map((s) => {
    const invoiced = s.payments.reduce((sum, p) => sum + p.invoiceAmount, 0);
    const paid = s.payments.reduce((sum, p) => sum + p.paidAmount, 0);
    return [s.name, s.shopName, s.contactPerson, s.mobile, invoiced, paid, Math.max(0, invoiced - paid)];
  });

  return csvResponse(
    "supplier-outstanding-report.csv",
    ["Supplier", "Shop Name", "Contact Person", "Mobile", "Total Invoiced", "Total Paid", "Outstanding"],
    rows
  );
}
