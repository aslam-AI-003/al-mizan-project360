import Link from "next/link";
import { Building2, Plus, ClipboardPlus } from "lucide-react";
import { getHomeData, type HomeProject } from "@/lib/dashboard-data";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { EmptyState } from "@/components/empty-state";
import { formatINR } from "@/lib/format";

export default async function HomePage(props: PageProps<"/admin">) {
  const sp = await props.searchParams;
  const view = sp.view === "completed" ? "completed" : "ongoing";
  const data = await getHomeData();
  const list = view === "completed" ? data.completed : data.ongoing;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Projects</h2>
          <p className="text-sm text-black/50">
            {data.ongoing.length} ongoing · {data.completed.length} completed
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/entry" className="btn-gold btn-sm">
            <ClipboardPlus size={16} /> Daily Entry
          </Link>
          <Link href="/admin/projects/new" className="btn-primary btn-sm">
            <Plus size={16} /> New Project
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Figure label="Today · Labour" value={data.today.labour} />
        <Figure label="Today · Material" value={data.today.material} />
        <Figure label="Today · Other" value={data.today.other} />
        <Figure label="Today · Total" value={data.today.total} strong />
        <Link href="/admin/suppliers" className="card col-span-2 p-4 transition hover:border-brand-navy/20 md:col-span-1">
          <p className="text-xs text-black/50">Supplier Pending</p>
          <p className="text-lg font-bold text-[var(--status-warning)]">{formatINR(data.supplierPending)}</p>
        </Link>
      </div>

      <div className="flex gap-2">
        <Tab href="/admin" active={view === "ongoing"} label={`Ongoing (${data.ongoing.length})`} />
        <Tab href="/admin?view=completed" active={view === "completed"} label={`Completed (${data.completed.length})`} />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={view === "completed" ? "No completed projects" : "No ongoing projects"}
          description={view === "ongoing" ? "Create a project to start tracking its budget." : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {list.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p }: { p: HomeProject }) {
  const usedPct = p.budget > 0 ? Math.min(100, Math.round((p.spent / p.budget) * 100)) : 0;
  const over = p.balance < 0;
  return (
    <div className="card p-4">
      <Link href={`/admin/projects/${p.id}`} className="block">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold text-[var(--foreground)]">{p.name}</p>
            <p className="truncate text-xs text-black/50">{p.clientName ? `${p.clientName} · ` : ""}{p.siteAddress}</p>
          </div>
          <StatusBadge status={p.status} />
        </div>

        <div className="my-3 grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-xs text-black/50">Budget</p>
            <p className="font-semibold">{formatINR(p.budget)}</p>
          </div>
          <div>
            <p className="text-xs text-black/50">Spent</p>
            <p className="font-semibold">{formatINR(p.spent)}</p>
          </div>
          <div>
            <p className="text-xs text-black/50">Balance</p>
            <p className={`font-bold ${over ? "text-[var(--status-danger)]" : "text-[var(--status-success)]"}`}>{formatINR(p.balance)}</p>
          </div>
        </div>

        <ProgressBar value={usedPct} barClassName={over ? "bg-[var(--status-danger)]" : undefined} />
        <div className="mt-1 flex justify-between text-xs text-black/40">
          <span>{usedPct}% of budget used</span>
          <span>Work progress {p.overallProgress}%</span>
        </div>
      </Link>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-black/5 pt-3">
        <p className="text-xs text-black/50">
          Today: Labour {formatINR(p.today.labour)} · Material {formatINR(p.today.material)}
        </p>
        <Link href={`/admin/entry?project=${p.id}`} className="btn-outline btn-sm shrink-0">
          <ClipboardPlus size={14} /> Entry
        </Link>
      </div>
    </div>
  );
}

function Figure({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-black/50">{label}</p>
      <p className={`text-lg font-bold ${strong ? "text-brand-gold" : "text-[var(--foreground)]"}`}>{formatINR(value)}</p>
    </div>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active ? "bg-brand-navy text-white" : "bg-white text-black/60 hover:bg-black/[0.04]"
      }`}
    >
      {label}
    </Link>
  );
}
