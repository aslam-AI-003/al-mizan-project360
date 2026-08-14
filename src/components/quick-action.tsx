import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function QuickAction({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <Link
      href={href}
      className="card flex flex-col items-center gap-2 p-4 text-center transition active:scale-[0.97] hover:border-brand-navy/20"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
        <Icon size={20} />
      </div>
      <p className="text-xs font-semibold leading-tight text-[var(--foreground)]">{label}</p>
    </Link>
  );
}
