"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_BOTTOM_NAV,
  SUPERVISOR_BOTTOM_NAV,
} from "./nav-config";

const NAV_BY_ROLE = {
  ADMIN: ADMIN_BOTTOM_NAV,
  SUPERVISOR: SUPERVISOR_BOTTOM_NAV,
} as const;

export function BottomNav({ role }: { role: keyof typeof NAV_BY_ROLE }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between">
        {items.map((item) => {
          const active = item.href === pathname || (item.href !== "/admin" && item.href !== "/supervisor" && pathname.startsWith(item.href));
          const isExactHome = ["/admin", "/supervisor"].includes(item.href) && pathname === item.href;
          const isActive = active || isExactHome;
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  isActive ? "text-brand-navy" : "text-black/40"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
