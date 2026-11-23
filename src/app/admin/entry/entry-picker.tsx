"use client";

import { useRouter } from "next/navigation";
import { Picker } from "@/components/picker";

export function EntryPicker({
  projects,
  projectId,
  date,
}: {
  projects: { id: string; name: string }[];
  projectId: string;
  date: string;
}) {
  const router = useRouter();
  const go = (p: string, d: string) => router.push(`/admin/entry?project=${encodeURIComponent(p)}&date=${encodeURIComponent(d)}`);

  return (
    <div className="card grid gap-3 p-4 sm:grid-cols-2">
      <div>
        <label className="label">Project</label>
        <Picker
          title="Project"
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
          value={projectId}
          onChange={(p) => go(p, date)}
        />
      </div>
      <div>
        <label className="label">Date</label>
        <input type="date" className="input" value={date} onChange={(e) => e.target.value && go(projectId, e.target.value)} />
      </div>
    </div>
  );
}
