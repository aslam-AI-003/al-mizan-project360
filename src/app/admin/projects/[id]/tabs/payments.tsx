import type { PaymentMilestone, ClientPayment, Project } from "@prisma/client";
import { formatDate, formatINR, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { recordClientPayment } from "../actions";

export function PaymentsTab({
  project,
  milestones,
  payments,
}: {
  project: Project;
  milestones: PaymentMilestone[];
  payments: ClientPayment[];
}) {
  const received = payments.reduce((s, p) => s + p.amount, 0);
  const pending = Math.max(0, project.contractValue - received);
  const receivedPct = project.contractValue > 0 ? Math.round((received / project.contractValue) * 100) : 0;
  const duePendingMilestones = milestones.filter((m) => m.status !== "PAID");

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-black/50">Contract Value</p>
            <p className="text-base font-bold text-[var(--foreground)]">{formatINR(project.contractValue)}</p>
          </div>
          <div>
            <p className="text-xs text-black/50">Received</p>
            <p className="text-base font-bold text-[var(--status-success)]">{formatINR(received)}</p>
          </div>
          <div>
            <p className="text-xs text-black/50">Pending</p>
            <p className="text-base font-bold text-[var(--status-warning)]">{formatINR(pending)}</p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={receivedPct} />
          <p className="mt-1 text-right text-xs text-black/40">{receivedPct}% received</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Payment Milestones</h3>
          <div className="card divide-y divide-black/5">
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{m.name}</p>
                  <p className="text-xs text-black/40">Due {formatDate(m.dueDate)}{m.paidDate ? ` · Paid ${formatDate(m.paidDate)}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--foreground)]">{formatINR(m.amount)}</p>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>

          <h3 className="mb-3 mt-6 text-sm font-bold text-[var(--foreground)]">Payment History</h3>
          <div className="card divide-y divide-black/5">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{formatDate(p.date)}</p>
                  <p className="text-xs text-black/40">{titleCase(p.mode)} {p.referenceNumber ? `· ${p.referenceNumber}` : ""}</p>
                </div>
                <p className="font-semibold text-[var(--status-success)]">{formatINR(p.amount)}</p>
              </div>
            ))}
            {payments.length === 0 && <p className="p-4 text-sm text-black/40">No payments recorded yet.</p>}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Record Client Payment</h3>
          <form action={recordClientPayment} className="card space-y-3 p-4">
            <input type="hidden" name="projectId" value={project.id} />
            <div>
              <label className="label">Milestone (optional)</label>
              <select name="milestoneId" className="select">
                <option value="">— Not tied to a milestone —</option>
                {duePendingMilestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({formatINR(m.amount)})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (₹)</label>
                <input type="number" name="amount" required className="input" />
              </div>
              <div>
                <label className="label">Mode</label>
                <select name="mode" className="select">
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Reference Number</label>
              <input type="text" name="referenceNumber" className="input" />
            </div>
            <div>
              <label className="label">Remarks</label>
              <input type="text" name="remarks" className="input" />
            </div>
            <button type="submit" className="btn-primary w-full">Record Payment</button>
          </form>
        </div>
      </div>
    </div>
  );
}
