import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Archive, ClipboardPlus } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { TabsNav } from "@/components/tabs-nav";
import { formatINR } from "@/lib/format";
import { getProjectSpend, getDailyLedger, getMaterialSummary } from "@/lib/project-costs";
import { OverviewTab } from "./tabs/overview";
import { LedgerTab } from "./tabs/ledger";
import { MaterialsTab } from "./tabs/materials";
import { SuppliersTab } from "./tabs/suppliers";
import { archiveProject } from "./actions";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "ledger", label: "Day-by-Day" },
  { key: "materials", label: "Materials" },
  { key: "suppliers", label: "Suppliers" },
];

export default async function ProjectDetailPage(props: PageProps<"/admin/projects/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? String(sp.tab) : "overview";

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();
  const spend = await getProjectSpend(id);
  const balance = project.budget - spend.total;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-black/50 hover:text-black/70">
          <ArrowLeft size={14} /> All Projects
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--foreground)]">{project.name}</h2>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-black/50">{project.siteAddress}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/entry?project=${project.id}`} className="btn-gold btn-sm">
              <ClipboardPlus size={14} /> Daily Entry
            </Link>
            {!project.archived && (
              <form action={archiveProject}>
                <input type="hidden" name="projectId" value={project.id} />
                <button type="submit" className="btn-outline btn-sm" title="Archive project">
                  <Archive size={14} /> Archive
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-lg">
          <div>
            <p className="text-xs text-black/40">Budget</p>
            <p className="text-sm font-bold">{formatINR(project.budget)}</p>
          </div>
          <div>
            <p className="text-xs text-black/40">Spent</p>
            <p className="text-sm font-bold">{formatINR(spend.total)}</p>
          </div>
          <div>
            <p className="text-xs text-black/40">Balance</p>
            <p className={`text-sm font-bold ${balance < 0 ? "text-[var(--status-danger)]" : "text-[var(--status-success)]"}`}>{formatINR(balance)}</p>
          </div>
        </div>
        <div className="mt-3 max-w-lg">
          <ProgressBar value={project.overallProgress} />
          <p className="mt-1 text-xs text-black/40">Work progress {project.overallProgress}%</p>
        </div>
      </div>

      <TabsNav tabs={TABS} />

      {tab === "ledger" ? (
        <LedgerTab project={project} spend={spend} days={await getDailyLedger(id, project.budget)} />
      ) : tab === "materials" ? (
        <MaterialsTab materials={await getMaterialSummary(id)} />
      ) : tab === "suppliers" ? (
        <SuppliersTab projectId={id} />
      ) : (
        <OverviewTab project={project} spend={spend} />
      )}
    </div>
  );
}
