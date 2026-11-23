"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/format";
import { Picker } from "@/components/picker";
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

  const materialOptions = materials.map((m) => {
    const s = stock.find((x) => x.name === m.name);
    return { value: m.name, label: m.name, hint: s ? `${s.inStock} ${s.unit} in stock · ${m.unit}` : m.unit };
  });
  const supplierOptions = suppliers.map((name) => ({ value: name, label: name }));
  const stockOptions = stock.map((s) => ({ value: s.name, label: s.name, hint: `${s.inStock} ${s.unit} in stock` }));
  const expenseOptions = EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }));

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

      {/* LABOUR */}
      <Section title="Labour" total={labourTotal} onAdd={() => setLabour((r) => [...r, emptyLabour()])}>
        {labour.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-x-2 gap-y-3 md:grid-cols-[8rem_10rem_1fr_auto] md:gap-y-0">
            <Field label="Workers">
              <input type="number" min={0} inputMode="numeric" className="input" value={row.workers} onChange={(e) => update(setLabour, i, { workers: e.target.value })} />
            </Field>
            <Field label="Amount (₹)">
              <input type="number" min={0} step="any" inputMode="decimal" className="input" value={row.amount} onChange={(e) => update(setLabour, i, { amount: e.target.value })} />
            </Field>
            <Field label="Note" className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
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
              <div className="grid grid-cols-2 gap-x-2 gap-y-3 lg:grid-cols-[1.3fr_6rem_6rem_7rem_1.2fr_auto] lg:gap-y-0">
                <Field label="Material" className="col-span-2 lg:col-span-1">
                  <Picker
                    title="Material"
                    placeholder="Choose material"
                    options={materialOptions}
                    allowCreate
                    value={row.material}
                    onChange={(material) => {
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
                <Field label="Supplier" className="col-span-2 lg:col-span-1">
                  <Picker title="Supplier" placeholder="Choose supplier" options={supplierOptions} allowCreate value={row.supplier} onChange={(supplier) => update(setPurchases, i, { supplier })} />
                </Field>
                <div className="hidden items-end justify-end lg:flex">
                  <RemoveButton onClick={() => remove(setPurchases, i)} />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <button type="button" onClick={() => remove(setPurchases, i)} className="text-[13px] font-medium text-red-600 lg:hidden">
                  Remove
                </button>
                <p className="ml-auto text-sm text-black/50">
                  Amount: <span className="font-bold text-[var(--foreground)]">{formatINR(amount)}</span>
                </p>
              </div>
            </div>
          );
        })}
        <p className="text-[13px] text-black/45 md:text-xs">New supplier or material names are saved automatically. Supplier payments are recorded on the Suppliers page.</p>
      </Section>

      {/* MATERIALS USED */}
      <Section title="Materials Used" onAdd={() => setUsage((r) => [...r, emptyUsage()])}>
        {usage.length === 0 && <p className="text-xs text-black/40">Optional. Add what was used from site stock today.</p>}
        {usage.map((row, i) => {
          const s = stockFor(row.material);
          return (
            <div key={i} className="grid grid-cols-[1fr_7rem_auto] gap-2 md:grid-cols-[1fr_9rem_auto]">
              <Field label="Material" hint={s ? `${s.inStock} ${s.unit} in stock` : undefined}>
                <Picker title="Material used" placeholder="Choose material" options={stockOptions} allowCreate value={row.material} onChange={(material) => update(setUsage, i, { material })} />
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
          <div key={i} className="grid grid-cols-[1fr_7.5rem_auto] gap-x-2 gap-y-3 md:grid-cols-[13rem_8rem_1fr_auto] md:gap-y-0">
            <Field label="Type">
              <Picker title="Expense type" options={expenseOptions} value={row.category} onChange={(v) => update(setExpenses, i, { category: v as ExpenseCategory })} />
            </Field>
            <Field label="Amount (₹)">
              <input type="number" min={0} step="any" inputMode="decimal" className="input" value={row.amount} onChange={(e) => update(setExpenses, i, { amount: e.target.value })} />
            </Field>
            <Field label="Note" className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
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

      {/* TOTALS + SAVE — one compact row on phones so it doesn't cover the form */}
      <div className="card sticky bottom-[4.5rem] z-10 p-3 md:bottom-4 md:space-y-3 md:p-4">
        {state?.error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 md:mb-0">{state.error}</p>}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 md:flex md:items-center md:justify-between">
            <div className="flex items-baseline gap-2 md:block">
              <p className="text-[13px] text-black/50 md:text-xs">Day total</p>
              <p className="text-base font-bold md:text-lg">{formatINR(dayTotal)}</p>
            </div>
            <div className="flex items-baseline gap-2 md:block md:text-right">
              <p className="text-[13px] text-black/50 md:text-xs">Balance</p>
              <p className={`text-base font-bold md:text-lg ${balanceAfter < 0 ? "text-[var(--status-danger)]" : "text-[var(--status-success)]"}`}>
                {formatINR(balanceAfter)}
              </p>
            </div>
          </div>
          <button type="submit" className="btn-primary shrink-0 md:hidden" disabled={pending}>
            {pending ? "Saving…" : "Save Day"}
          </button>
        </div>
        <button type="submit" className="btn-primary hidden w-full md:flex" disabled={pending}>
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
        <h3 className="text-base font-bold text-[var(--foreground)] md:text-sm">
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
    <div className={`min-w-0 ${className ?? ""}`}>
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
      className="mt-[1.6rem] flex h-11 w-11 items-center justify-center self-start rounded-xl text-black/40 hover:bg-red-50 hover:text-red-600 md:h-10 md:w-10"
      title="Remove row"
    >
      <Trash2 size={16} />
    </button>
  );
}
