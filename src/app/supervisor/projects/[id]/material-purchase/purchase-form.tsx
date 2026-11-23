"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";
import { recordMaterialPurchase } from "./actions";

type MaterialOption = { id: string; name: string; unit: string };

export function MaterialPurchaseForm({ projectId, materials }: { projectId: string; materials: MaterialOption[] }) {
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const selectedMaterial = materials.find((m) => m.id === materialId);
  const total = (Number(quantity) || 0) * (Number(rate) || 0);

  return (
    <form action={recordMaterialPurchase} className="card space-y-3 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      <div>
        <label className="label">Material</label>
        <select name="materialId" required className="select" value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Quantity</label>
          <input type="number" name="quantity" min="0.01" step="0.01" required className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className="label">Unit</label>
          <input type="text" name="unit" key={materialId} defaultValue={selectedMaterial?.unit ?? ""} required className="input" />
        </div>
      </div>
      <div>
        <label className="label">Rate (per unit, ₹)</label>
        <input type="number" name="rate" min="0.01" step="0.01" required className="input" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      <p className="text-sm text-black/60">
        Total: <span className="font-bold text-[var(--foreground)]">{formatINR(total)}</span>
      </p>
      <div>
        <label className="label">Date</label>
        <input type="date" name="date" required className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <div>
        <label className="label">Shop / Vendor (optional)</label>
        <input type="text" name="vendorName" className="input" placeholder="e.g. Sri Murugan Cements" />
      </div>
      <div>
        <label className="label">Bill Photo URL (optional)</label>
        <input type="url" name="billPhotoUrl" className="input" placeholder="https://..." />
      </div>
      <div>
        <label className="label">Remarks (optional)</label>
        <textarea name="remarks" rows={2} className="textarea" />
      </div>
      <button type="submit" className="btn-primary w-full">Save Purchase</button>
    </form>
  );
}
