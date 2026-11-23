"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OWNER_NAV } from "./nav-config";

export function BottomNav() {
  const pathname = usePathname();
  const items = OWNER_NAV;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between">
        {items.map((item) => {
          const active = item.href === pathname || (item.href !== "/admin" && pathname.startsWith(item.href));
          const isExactHome = item.href === "/admin" && pathname === item.href;
          const isActive = active || isExactHome;
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
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
