import type { Worker, WorkerAttendance, WorkerPayment } from "@prisma/client";
import { formatDate, formatDateShort, formatINR, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { recordWorkerPayment } from "../actions";

export function LabourTab({
  projectId,
  workers,
  attendance,
  payments,
}: {
  projectId: string;
  workers: Worker[];
  attendance: WorkerAttendance[];
  payments: WorkerPayment[];
}) {
  const workerById = new Map(workers.map((w) => [w.id, w]));

  return (
    <div className="space-y-6">
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs text-black/40">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Daily Wage</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-black/50">{w.workerCode}</td>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">{w.name}</td>
                <td className="px-4 py-3">{titleCase(w.workerType)}</td>
                <td className="px-4 py-3">{formatINR(w.dailyWage)}</td>
                <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Recent Attendance</h3>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs text-black/40">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Wage</th>
              </tr>
            </thead>
            <tbody>
              {attendance.slice(0, 20).map((a) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-black/60">{formatDateShort(a.date)}</td>
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{workerById.get(a.workerId)?.name ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">{formatINR(a.wageAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Salary Payments</h3>
          <div className="card divide-y divide-black/5">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{workerById.get(p.workerId)?.name ?? "—"}</p>
                  <p className="text-xs text-black/40">{formatDate(p.paymentDate)} · {titleCase(p.mode)}</p>
                </div>
                <p className="font-semibold text-[var(--foreground)]">{formatINR(p.amount)}</p>
              </div>
            ))}
            {payments.length === 0 && <p className="p-4 text-sm text-black/40">No payments recorded yet.</p>}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Record Payment</h3>
          <form action={recordWorkerPayment} className="card space-y-3 p-4">
            <input type="hidden" name="projectId" value={projectId} />
            <div>
              <label className="label">Worker</label>
              <select name="workerId" required className="select">
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.workerCode})</option>
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
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Reference Number</label>
              <input type="text" name="referenceNumber" className="input" />
            </div>
            <button type="submit" className="btn-primary w-full">Record Payment</button>
          </form>
        </div>
      </div>
    </div>
  );
}
