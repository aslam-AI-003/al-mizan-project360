"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_SIDEBAR_NAV,
  SUPERVISOR_SIDEBAR_NAV,
  CLIENT_SIDEBAR_NAV,
} from "./nav-config";

const NAV_BY_ROLE = {
  ADMIN: ADMIN_SIDEBAR_NAV,
  SUPERVISOR: SUPERVISOR_SIDEBAR_NAV,
  CLIENT: CLIENT_SIDEBAR_NAV,
} as const;

export function Sidebar({
  role,
  brandLabel,
  name,
  roleLabel,
}: {
  role: keyof typeof NAV_BY_ROLE;
  brandLabel: string;
  name: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-black/5 bg-white md:flex md:flex-col">
      <div className="flex items-center gap-3 border-b border-black/5 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold text-sm font-bold text-white">
          AM
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-[var(--foreground)]">Al-Mizan</p>
          <p className="text-xs leading-tight text-black/50">{brandLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const isHome = ["/admin", "/supervisor", "/client"].includes(item.href);
          const isActive = isHome ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "bg-brand-navy text-white" : "text-black/60 hover:bg-black/[0.04]"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-black/5 px-5 py-4">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</p>
        <p className="text-xs text-black/50">{roleLabel}</p>
      </div>
    </aside>
  );
}
