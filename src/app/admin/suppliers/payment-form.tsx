import { todayKey } from "@/lib/date-range";
import { Picker } from "@/components/picker";
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
          <Picker
            name="supplierId"
            title="Supplier"
            defaultValue={suppliers?.[0]?.id}
            options={(suppliers ?? []).map((s) => ({
              value: s.id,
              label: s.name,
              hint: s.pending > 0 ? `₹${Math.round(s.pending).toLocaleString("en-IN")} pending` : "Nothing pending",
            }))}
          />
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
          <Picker name="mode" title="Payment mode" defaultValue="CASH" options={[
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
]} />
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
