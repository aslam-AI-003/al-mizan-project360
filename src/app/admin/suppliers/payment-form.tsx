import { todayKey } from "@/lib/date-range";
import { recordSupplierPayment } from "./actions";

/** Record a payment to a supplier. Pass supplierId to fix the supplier, or a list to choose from. */
export function PaymentForm({ supplierId, suppliers }: { supplierId?: string; suppliers?: { id: string; name: string; pending: number }[] }) {
  return (
    <form action={recordSupplierPayment} className="card space-y-3 p-4">
      <h3 className="text-sm font-bold text-[var(--foreground)]">Record Payment</h3>
      {supplierId ? (
        <input type="hidden" name="supplierId" value={supplierId} />
      ) : (
        <div>
          <label className="label">Supplier</label>
          <select name="supplierId" required className="select">
            {suppliers?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.pending > 0 ? ` — ₹${Math.round(s.pending).toLocaleString("en-IN")} pending` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount (₹)</label>
          <input type="number" name="amount" min="1" step="any" required className="input" />
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" name="date" required defaultValue={todayKey()} className="input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Mode</label>
          <select name="mode" className="select" defaultValue="CASH">
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>
        <div>
          <label className="label">Note</label>
          <input name="note" className="input" placeholder="Optional" />
        </div>
      </div>
      <button type="submit" className="btn-primary w-full">Save Payment</button>
    </form>
  );
}
