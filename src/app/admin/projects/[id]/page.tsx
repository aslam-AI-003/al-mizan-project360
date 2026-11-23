import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Archive } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { TabsNav } from "@/components/tabs-nav";
import { formatINR } from "@/lib/format";
import { getProjectSpend, getDailyLedger } from "@/lib/project-costs";
import {
  getProjectHeader,
  getProgressData,
  getDailyUpdatesData,
  getLabourData,
  getMaterialsData,
  getPurchasesData,
  getExpensesData,
} from "./data";
import { OverviewTab } from "./tabs/overview";
import { ProgressTab } from "./tabs/progress";
import { DailyUpdatesTab } from "./tabs/daily-updates";
import { LabourTab } from "./tabs/labour";
import { MaterialsTab } from "./tabs/materials";
import { PurchasesTab } from "./tabs/purchases";
import { ExpensesTab } from "./tabs/expenses";
import { LedgerTab } from "./tabs/ledger";
import { archiveProject } from "./actions";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "progress", label: "Progress" },
  { key: "daily-updates", label: "Daily Updates" },
  { key: "labour", label: "Labour" },
  { key: "materials", label: "Materials" },
  { key: "purchases", label: "Material Purchases" },
  { key: "expenses", label: "Expenses" },
  { key: "ledger", label: "Budget Ledger" },
];

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.key === rawTab) ? rawTab! : "overview";

  const project = await getProjectHeader(id);
  if (!project) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/projects" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-black/50 hover:text-black/70">
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
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-black/40">Budget</p>
              <p className="text-sm font-bold text-[var(--foreground)]">{formatINR(project.budget)}</p>
            </div>
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
        <div className="mt-3 max-w-md">
          <ProgressBar value={project.overallProgress} />
        </div>
      </div>

      <TabsNav tabs={TABS} />

      <TabContent tab={tab} projectId={id} project={project} />
    </div>
  );
}

async function TabContent({
  tab,
  projectId,
  project,
}: {
  tab: string;
  projectId: string;
  project: NonNullable<Awaited<ReturnType<typeof getProjectHeader>>>;
}) {
  switch (tab) {
    case "progress": {
      const stages = await getProgressData(projectId);
      return <ProgressTab projectId={projectId} stages={stages} />;
    }
    case "daily-updates": {
      const reports = await getDailyUpdatesData(projectId);
      return <DailyUpdatesTab reports={reports} />;
    }
    case "labour": {
      const [workers, attendance, payments] = await getLabourData(projectId);
      return <LabourTab projectId={projectId} workers={workers} attendance={attendance} payments={payments} />;
    }
    case "materials": {
      const [inventory, transactions, materials, otherProjects] = await getMaterialsData(projectId);
      return (
        <MaterialsTab
          projectId={projectId}
          inventory={inventory}
          transactions={transactions}
          materials={materials}
          otherProjects={otherProjects}
        />
      );
    }
    case "purchases": {
      const purchases = await getPurchasesData(projectId);
      return <PurchasesTab purchases={purchases} />;
    }
    case "expenses": {
      const expenses = await getExpensesData(projectId);
      return <ExpensesTab expenses={expenses} />;
    }
    case "ledger": {
      const [spend, days] = await Promise.all([
        getProjectSpend(projectId),
        getDailyLedger(projectId, project.budget),
      ]);
      return <LedgerTab project={project} spend={spend} days={days} />;
    }
    default: {
      const spend = await getProjectSpend(projectId);
      return <OverviewTab project={project} spent={spend.total} />;
    }
  }
}
