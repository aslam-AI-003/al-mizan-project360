"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/format";
import { saveDailyEntry, type DailyEntryPayload } from "./actions";

const EXPENSE_CATEGORIES = [
  { value: "TRANSPORT", label: "Transport" },
  { value: "FOOD", label: "Food / Tea" },
  { value: "TOOLS", label: "Tools" },
  { value: "WATER", label: "Water" },
  { value: "LOADING_UNLOADING", label: "Loading & Unloading" },
  { value: "VEHICLE", label: "Vehicle" },
  { value: "LABOUR_ADVANCE", label: "Labour Advance" },
  { value: "MISCELLANEOUS", label: "Miscellaneous" },
  { value: "OTHER", label: "Other" },
] as const;

type ExpenseCategory = DailyEntryPayload["expenses"][number]["category"];

type LabourRow = { id?: string; workers: string; amount: string; note: string };
type PurchaseRow = { id?: string; material: string; unit: string; quantity: string; rate: string; supplier: string };
type UsageRow = { material: string; quantity: string };
type ExpenseRow = { id?: string; category: ExpenseCategory; amount: string; note: string };

export type InitialEntry = {
  progress: number;
  labour: LabourRow[];
  purchases: PurchaseRow[];
  usage: UsageRow[];
  expenses: ExpenseRow[];
};

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const emptyLabour = (): LabourRow => ({ workers: "", amount: "", note: "" });
const emptyPurchase = (): PurchaseRow => ({ material: "", unit: "", quantity: "", rate: "", supplier: "" });
const emptyUsage = (): UsageRow => ({ material: "", quantity: "" });
const emptyExpense = (): ExpenseRow => ({ category: "TRANSPORT", amount: "", note: "" });

export function DailyEntryForm({
  projectId,
  date,
  budget,
  spentBeforeThisDay,
  initial,
  materials,
  suppliers,
  stock,
}: {
  projectId: string;
  date: string;
  budget: number;
  spentBeforeThisDay: number;
  initial: InitialEntry;
  materials: { name: string; unit: string }[];
  suppliers: string[];
  stock: { name: string; unit: string; inStock: number }[];
}) {
  const [state, formAction, pending] = useActionState(saveDailyEntry, null);
  const [progress, setProgress] = useState(String(initial.progress));
  const [labour, setLabour] = useState<LabourRow[]>(initial.labour.length ? initial.labour : [emptyLabour()]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>(initial.purchases.length ? initial.purchases : [emptyPurchase()]);
  const [usage, setUsage] = useState<UsageRow[]>(initial.usage);
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initial.expenses);

  const unitFor = (name: string) => materials.find((m) => m.name.toLowerCase() === name.trim().toLowerCase())?.unit;
  const stockFor = (name: string) => stock.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());

  const labourTotal = labour.reduce((s, r) => s + num(r.amount), 0);
  const materialTotal = purchases.reduce((s, r) => s + num(r.quantity) * num(r.rate), 0);
  const otherTotal = expenses.reduce((s, r) => s + num(r.amount), 0);
  const dayTotal = labourTotal + materialTotal + otherTotal;
  const balanceAfter = budget - spentBeforeThisDay - dayTotal;

  // Rows the user left completely blank are ignored; partly filled rows are validated by the server.
  const payload: DailyEntryPayload = {
    projectId,
    date,
    progress: progress.trim() === "" ? null : Math.round(num(progress)),
    labour: labour
      .filter((r) => r.workers || r.amount || r.note)
      .map((r) => ({ id: r.id, workers: Math.round(num(r.workers)), amount: num(r.amount), note: r.note })),
    purchases: purchases
      .filter((r) => r.material || r.quantity || r.rate || r.supplier)
      .map((r) => ({
        id: r.id,
        material: r.material,
        unit: r.unit || unitFor(r.material) || "",
        quantity: num(r.quantity),
        rate: num(r.rate),
        supplier: r.supplier,
      })),
    usage: usage.filter((r) => r.material || r.quantity).map((r) => ({ material: r.material, quantity: num(r.quantity) })),
    expenses: expenses
      .filter((r) => r.amount || r.note)
      .map((r) => ({ id: r.id, category: r.category, amount: num(r.amount), note: r.note })),
  };

  function update<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number, patch: Partial<T>) {
    setter((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function remove<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number) {
    setter((rows) => rows.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <datalist id="material-options">
        {materials.map((m) => (
          <option key={m.name} value={m.name} />
        ))}
      </datalist>
      <datalist id="supplier-options">
        {suppliers.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="stock-options">
        {stock.map((s) => (
          <option key={s.name} value={s.name}>{`${s.inStock} ${s.unit} in stock`}</option>
        ))}
      </datalist>

      {/* LABOUR */}
      <Section title="Labour" total={labourTotal} onAdd={() => setLabour((r) => [...r, emptyLabour()])}>
        {labour.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:grid-cols-[8rem_10rem_1fr_auto]">
            <Field label="Workers">
              <input type="number" min={0} inputMode="numeric" className="input" value={row.workers} onChange={(e) => update(setLabour, i, { workers: e.target.value })} />
            </Field>
            <Field label="Amount (₹)">
              <input type="number" min={0} step="any" inputMode="decimal" className="input" value={row.amount} onChange={(e) => update(setLabour, i, { amount: e.target.value })} />
            </Field>
            <Field label="Note" className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
              <input className="input" placeholder="e.g. Masonry, 2 helpers" value={row.note} onChange={(e) => update(setLabour, i, { note: e.target.value })} />
            </Field>
            <RemoveButton onClick={() => remove(setLabour, i)} />
          </div>
        ))}
      </Section>

      {/* MATERIALS BOUGHT */}
      <Section title="Materials Bought" total={materialTotal} onAdd={() => setPurchases((r) => [...r, emptyPurchase()])}>
        {purchases.map((row, i) => {
          const amount = num(row.quantity) * num(row.rate);
          return (
            <div key={i} className="rounded-xl border border-black/5 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_6rem_7rem_7rem_1fr_auto]">
                <Field label="Material" className="col-span-2 sm:col-span-1">
                  <input
                    list="material-options"
                    className="input"
                    placeholder="e.g. Cement"
                    value={row.material}
                    onChange={(e) => {
                      const material = e.target.value;
                      const known = unitFor(material);
                      update(setPurchases, i, { material, ...(known ? { unit: known } : {}) });
                    }}
                  />
                </Field>
                <Field label="Qty">
                  <input type="number" min={0} step="any" inputMode="decimal" className="input" value={row.quantity} onChange={(e) => update(setPurchases, i, { quantity: e.target.value })} />
                </Field>
                <Field label="Unit">
                  <input className="input" placeholder="bags" value={row.unit} onChange={(e) => update(setPurchases, i, { unit: e.target.value })} />
                </Field>
                <Field label="Rate (₹)">
                  <input type="number" min={0} step="any" inputMode="decimal" className="input" value={row.rate} onChange={(e) => update(setPurchases, i, { rate: e.target.value })} />
                </Field>
                <Field label="Supplier">
                  <input list="supplier-options" className="input" placeholder="Shop name" value={row.supplier} onChange={(e) => update(setPurchases, i, { supplier: e.target.value })} />
                </Field>
                <div className="flex items-end justify-end">
                  <RemoveButton onClick={() => remove(setPurchases, i)} />
                </div>
              </div>
              <p className="mt-2 text-right text-xs text-black/50">
                Amount: <span className="font-semibold text-[var(--foreground)]">{formatINR(amount)}</span>
              </p>
            </div>
          );
        })}
        <p className="text-xs text-black/40">New supplier or material names are saved automatically. Supplier payments are recorded on the Suppliers page.</p>
      </Section>

      {/* MATERIALS USED */}
      <Section title="Materials Used" onAdd={() => setUsage((r) => [...r, emptyUsage()])}>
        {usage.length === 0 && <p className="text-xs text-black/40">Optional. Add what was used from site stock today.</p>}
        {usage.map((row, i) => {
          const s = stockFor(row.material);
          return (
            <div key={i} className="grid grid-cols-[1fr_7rem_auto] gap-2">
              <Field label="Material" hint={s ? `${s.inStock} ${s.unit} in stock` : undefined}>
                <input list="stock-options" className="input" value={row.material} onChange={(e) => update(setUsage, i, { material: e.target.value })} />
              </Field>
              <Field label={`Qty${s ? ` (${s.unit})` : ""}`}>
                <input type="number" min={0} step="any" inputMode="decimal" className="input" value={row.quantity} onChange={(e) => update(setUsage, i, { quantity: e.target.value })} />
              </Field>
              <RemoveButton onClick={() => remove(setUsage, i)} />
            </div>
          );
        })}
      </Section>

      {/* OTHER EXPENSES */}
      <Section title="Other Expenses" total={otherTotal} onAdd={() => setExpenses((r) => [...r, emptyExpense()])}>
        {expenses.length === 0 && <p className="text-xs text-black/40">Optional. Transport, tea, tools, etc.</p>}
        {expenses.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_8rem_auto] gap-2 sm:grid-cols-[12rem_8rem_1fr_auto]">
            <Field label="Type">
              <select className="select" value={row.category} onChange={(e) => update(setExpenses, i, { category: e.target.value as ExpenseCategory })}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Amount (₹)">
              <input type="number" min={0} step="any" inputMode="decimal" className="input" value={row.amount} onChange={(e) => update(setExpenses, i, { amount: e.target.value })} />
            </Field>
            <Field label="Note" className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
              <input className="input" value={row.note} onChange={(e) => update(setExpenses, i, { note: e.target.value })} />
            </Field>
            <RemoveButton onClick={() => remove(setExpenses, i)} />
          </div>
        ))}
      </Section>

      {/* PROGRESS */}
      <div className="card p-4">
        <Field label="Project progress (%)">
          <input type="number" min={0} max={100} className="input max-w-[8rem]" value={progress} onChange={(e) => setProgress(e.target.value)} />
        </Field>
      </div>

      {/* TOTALS + SAVE */}
      <div className="card sticky bottom-20 z-10 space-y-3 p-4 md:bottom-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <p className="text-xs text-black/50">Day total</p>
            <p className="text-lg font-bold text-[var(--foreground)]">{formatINR(dayTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-black/50">Budget balance after this day</p>
            <p className={`text-lg font-bold ${balanceAfter < 0 ? "text-[var(--status-danger)]" : "text-[var(--status-success)]"}`}>
              {formatINR(balanceAfter)}
            </p>
          </div>
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Saving..." : "Save Day"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  total,
  onAdd,
  children,
}: {
  title: string;
  total?: number;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--foreground)]">
          {title}
          {total !== undefined && <span className="ml-2 font-semibold text-black/50">{formatINR(total)}</span>}
        </h3>
        <button type="button" className="btn-outline btn-sm" onClick={onAdd}>
          <Plus size={14} /> Add
        </button>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {hint && <span className="ml-1 font-normal text-black/40">· {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 flex h-10 w-10 items-center justify-center self-start rounded-xl text-black/40 hover:bg-red-50 hover:text-red-600"
      title="Remove row"
    >
      <Trash2 size={16} />
    </button>
  );
}
