import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  Calendar,
  HardHat,
  ShoppingCart,
  Boxes,
  Receipt,
  Wallet,
  Truck,
  Scale,
  Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ReportCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
};

const REPORTS: ReportCard[] = [
  { title: "Daily Project Report", description: "Day-wise progress across all sites.", icon: CalendarDays },
  { title: "Weekly Project Report", description: "Weekly rollup of site activity.", icon: CalendarRange },
  { title: "Monthly Project Report", description: "Monthly rollup of site activity.", icon: Calendar },
  {
    title: "Labour Attendance Report",
    description: "Attendance and wages by worker and project.",
    icon: HardHat,
    href: "/admin/reports/labour-attendance",
  },
  { title: "Material Purchase Report", description: "Purchases raised across projects.", icon: ShoppingCart },
  { title: "Material Consumption Report", description: "Material usage vs stock.", icon: Boxes },
  {
    title: "Site Expenses Report",
    description: "Site-level expenses by category.",
    icon: Receipt,
    href: "/admin/reports/site-expenses",
  },
  {
    title: "Client Payments Report",
    description: "Payments received from clients.",
    icon: Wallet,
    href: "/admin/reports/client-payments",
  },
  {
    title: "Supplier Outstanding Report",
    description: "Amount owed to each supplier.",
    icon: Truck,
    href: "/admin/reports/supplier-outstanding",
  },
  {
    title: "Budget vs Actual Report",
    description: "Budget vs actual spend by project.",
    icon: Scale,
    href: "/admin/reports/budget-vs-actual",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Reports</h2>
        <p className="text-sm text-black/50">Generate and export reports across the business.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {REPORTS.map((report) =>
          report.href ? (
            <Link key={report.title} href={report.href} className="card flex flex-col gap-3 p-4 transition hover:border-brand-navy/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
                <report.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">{report.title}</p>
                <p className="text-xs text-black/50">{report.description}</p>
              </div>
            </Link>
          ) : (
            <div key={report.title} className="card flex flex-col gap-3 p-4 opacity-60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.05] text-black/40">
                <report.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">{report.title}</p>
                <p className="text-xs text-black/50">{report.description}</p>
              </div>
              <span className="badge w-fit bg-black/[0.06] text-black/50">
                <Lock size={11} /> Coming soon
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
