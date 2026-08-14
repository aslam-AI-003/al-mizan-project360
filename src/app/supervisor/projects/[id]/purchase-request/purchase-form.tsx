"use client";

import { useState } from "react";
import { submitPurchaseRequest } from "./actions";

type MaterialOption = { id: string; name: string; unit: string };
type SupplierOption = { id: string; name: string; shopName: string };

export function PurchaseRequestForm({
  projectId,
  materials,
  suppliers,
}: {
  projectId: string;
  materials: MaterialOption[];
  suppliers: SupplierOption[];
}) {
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const selectedMaterial = materials.find((m) => m.id === materialId);

  return (
    <form action={submitPurchaseRequest} className="card space-y-3 p-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div>
        <label className="label">Supplier</label>
        <select name="supplierId" required className="select" defaultValue={suppliers[0]?.id ?? ""}>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.shopName})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Material</label>
        <select
          name="materialId"
          required
          className="select"
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
        >
          {materials.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Quantity</label>
          <input type="number" name="quantity" min="0.01" step="0.01" required className="input" />
        </div>
        <div>
          <label className="label">Unit</label>
          <input type="text" name="unit" key={materialId} defaultValue={selectedMaterial?.unit ?? ""} required className="input" />
        </div>
      </div>

      <div>
        <label className="label">Rate (per unit, ₹)</label>
        <input type="number" name="rate" min="0.01" step="0.01" required className="input" />
      </div>

      <div>
        <label className="label">Required Date</label>
        <input type="date" name="requiredDate" required className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>

      <div>
        <label className="label">Remarks (optional)</label>
        <textarea name="remarks" rows={2} className="textarea" placeholder="Any notes for the office..." />
      </div>

      <button type="submit" className="btn-primary w-full">Submit Purchase Request</button>
    </form>
  );
}
