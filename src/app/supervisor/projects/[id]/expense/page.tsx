import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOwnedProjectOrRedirect } from "@/lib/supervisor-guard";
import { submitExpense } from "./actions";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "TRANSPORT", label: "Transport" },
  { value: "FOOD", label: "Food" },
  { value: "TOOLS", label: "Tools" },
  { value: "WATER", label: "Water" },
  { value: "LOADING_UNLOADING", label: "Loading & Unloading" },
  { value: "LABOUR_ADVANCE", label: "Labour Advance" },
  { value: "VEHICLE", label: "Vehicle" },
  { value: "MISCELLANEOUS", label: "Miscellaneous" },
  { value: "OTHER", label: "Other" },
];

export default async function ExpensePage({ params }: PageProps<"/supervisor/projects/[id]/expense">) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "SUPERVISOR") redirect("/login");
  const project = await getOwnedProjectOrRedirect(id, session.userId);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Log Expense</h2>
        <p className="text-sm text-black/50">{project.name}</p>
      </div>

      <form action={submitExpense} className="card space-y-3 p-4">
        <input type="hidden" name="projectId" value={id} />

        <div>
          <label className="label">Category</label>
          <select name="category" required className="select" defaultValue="MISCELLANEOUS">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Amount (₹)</label>
          <input type="number" name="amount" min="1" step="1" required className="input" />
        </div>

        <div>
          <label className="label">Date</label>
          <input type="date" name="date" required className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={2} required className="textarea" placeholder="What was this expense for?" />
        </div>

        <div>
          <label className="label">Payment Mode</label>
          <select name="paymentMode" required className="select" defaultValue="CASH">
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>

        <div>
          <label className="label">Receipt Photo URL (optional)</label>
          <input type="url" name="receiptPhotoUrl" className="input" placeholder="https://..." />
        </div>

        <button type="submit" className="btn-primary w-full">Submit Expense</button>
      </form>
    </div>
  );
}
