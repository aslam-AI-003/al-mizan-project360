import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Users,
  HardHat,
  Wallet,
  ClipboardCheck,
  Package,
  Truck,
  Boxes,
} from "lucide-react";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { StatTile } from "@/components/stat-tile";
import { formatINR } from "@/lib/format";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Business Overview</h2>
        <p className="text-sm text-black/50">Real-time snapshot across all sites.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total Projects" value={String(data.totalProjects)} icon={Building2} tone="navy" />
        <StatTile label="Active Projects" value={String(data.activeProjects)} icon={HardHat} tone="info" />
        <StatTile label="Completed" value={String(data.completedProjects)} icon={CheckCircle2} tone="success" />
        <StatTile label="Delayed" value={String(data.delayedProjects)} icon={AlertTriangle} tone="danger" />
        <StatTile label="Total Clients" value={String(data.totalClients)} icon={Users} tone="navy" />
        <StatTile label="Active Supervisors" value={String(data.activeSupervisors)} icon={HardHat} tone="gold" />
        <StatTile label="Today's Labour" value={String(data.todaysLabourCount)} sublabel="workers on site" icon={Users} tone="info" />
        <StatTile label="Pending Approvals" value={String(data.pendingApprovals)} icon={ClipboardCheck} tone="warning" />
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Today&apos;s Business Summary</h3>
          <span className="text-xs text-black/40">
            {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryRow label="Labour Cost" value={data.todaysLabourCost} />
          <SummaryRow label="Material Purchase" value={data.todaysMaterialPurchase} />
          <SummaryRow label="Other Expenses" value={data.todaysOtherExpenses} />
          <SummaryRow label="Total Site Spending" value={data.todaysTotalSpending} emphasize />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link href="/admin/reports" className="card p-4 transition hover:border-brand-navy/20">
          <div className="mb-2 flex items-center gap-2 text-[var(--status-warning)]">
            <Wallet size={16} />
            <p className="text-xs font-semibold">Pending Client Payments</p>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">{formatINR(data.pendingClientPayments)}</p>
        </Link>
        <Link href="/admin/suppliers" className="card p-4 transition hover:border-brand-navy/20">
          <div className="mb-2 flex items-center gap-2 text-[var(--status-danger)]">
            <Truck size={16} />
            <p className="text-xs font-semibold">Supplier Outstanding</p>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">{formatINR(data.supplierOutstanding)}</p>
        </Link>
        <Link href="/admin/more" className="card p-4 transition hover:border-brand-navy/20">
          <div className="mb-2 flex items-center gap-2 text-[var(--status-info)]">
            <Boxes size={16} />
            <p className="text-xs font-semibold">Low Stock Alerts</p>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">{data.lowStockCount} materials</p>
        </Link>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Latest Site Photos</h3>
          <Link href="/admin/projects" className="text-xs font-semibold text-brand-navy">View projects →</Link>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {data.recentPhotos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.url}
              alt={photo.caption}
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
        </div>
        {data.recentPhotos.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-black/40">
            <Package size={16} /> No photos uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div>
      <p className="text-xs text-black/50">{label}</p>
      <p className={emphasize ? "text-lg font-bold text-brand-gold" : "text-base font-semibold text-[var(--foreground)]"}>
        {formatINR(value)}
      </p>
    </div>
  );
}
