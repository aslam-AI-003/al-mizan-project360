import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] text-black/40">
        <Icon size={22} />
      </div>
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      {description && <p className="max-w-xs text-xs text-black/50">{description}</p>}
    </div>
  );
}
