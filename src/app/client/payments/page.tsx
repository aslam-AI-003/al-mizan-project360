import { Wallet, TrendingUp, Clock3, Receipt, ListChecks } from "lucide-react";
import { prisma } from "@/lib/db";
import { getClientContext } from "@/lib/client-data";
import { formatINR, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { StatTile } from "@/components/stat-tile";
import { EmptyState } from "@/components/empty-state";

export default async function ClientPaymentsPage() {
  const { project } = await getClientContext();

  if (!project) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No project assigned yet"
        description="Payment details will show up once your project is set up."
      />
    );
  }

  const [milestones, payments] = await Promise.all([
    prisma.paymentMilestone.findMany({ where: { projectId: project.id }, orderBy: { order: "asc" } }),
    prisma.clientPayment.findMany({ where: { projectId: project.id }, orderBy: { date: "desc" } }),
  ]);

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const pending = Math.max(0, project.contractValue - totalReceived);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Payments</h2>
        <p className="text-sm text-black/50">{project.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatTile label="Contract Value" value={formatINR(project.contractValue)} icon={Wallet} tone="navy" />
        <StatTile label="Received" value={formatINR(totalReceived)} icon={TrendingUp} tone="success" />
        <StatTile label="Pending" value={formatINR(pending)} icon={Clock3} tone="warning" />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Payment Milestones</h3>
        {milestones.length === 0 ? (
          <EmptyState icon={ListChecks} title="No milestones set up" />
        ) : (
          <div className="card divide-y divide-black/5">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{milestone.name}</p>
                  <p className="text-xs text-black/40">
                    Due {formatDate(milestone.dueDate)}
                    {milestone.paidDate ? ` · Paid ${formatDate(milestone.paidDate)}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-[var(--foreground)]">{formatINR(milestone.amount)}</p>
                  <StatusBadge status={milestone.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Payment History</h3>
        {payments.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments recorded yet" />
        ) : (
          <div className="card divide-y divide-black/5">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{formatDate(payment.date)}</p>
                  <p className="text-xs text-black/40">
                    {payment.mode.replace("_", " ")}
                    {payment.referenceNumber ? ` · Ref ${payment.referenceNumber}` : ""}
                  </p>
                  {payment.remarks && <p className="text-xs text-black/40">{payment.remarks}</p>}
                </div>
                <p className="shrink-0 text-sm font-bold text-[var(--status-success)]">
                  {formatINR(payment.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
