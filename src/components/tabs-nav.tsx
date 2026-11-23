"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function TabsNav({ tabs }: { tabs: { key: string; label: string }[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? tabs[0]?.key;

  return (
    // Phone: fade the right edge so it's clear more tabs scroll into view.
    <div className="-mx-4 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] md:mx-0 md:px-0 md:[mask-image:none]">
      <div className="flex gap-1.5 border-b border-black/5 pb-px">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={`${pathname}?tab=${tab.key}`}
              className={`whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "border-b-2 border-brand-navy text-brand-navy"
                  : "border-b-2 border-transparent text-black/45 hover:text-black/70"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
