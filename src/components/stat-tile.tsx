import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  tone?: "navy" | "gold" | "success" | "danger" | "warning" | "info";
}) {
  const toneClasses: Record<string, string> = {
    navy: "bg-brand-navy/10 text-brand-navy",
    gold: "bg-brand-gold/15 text-brand-gold",
    success: "bg-[var(--status-success-bg)] text-[var(--status-success)]",
    danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger)]",
    warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
    info: "bg-[var(--status-info-bg)] text-[var(--status-info)]",
  };

  return (
    <div className="card flex items-start gap-3 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-black/50">{label}</p>
        <p className="text-lg font-bold text-[var(--foreground)]">{value}</p>
        {sublabel && <p className="truncate text-xs text-black/40">{sublabel}</p>}
      </div>
    </div>
  );
}
