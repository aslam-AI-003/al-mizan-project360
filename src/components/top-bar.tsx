import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { logout } from "@/lib/session-actions";

export function TopBar({
  title,
  notificationsHref,
  unreadCount = 0,
}: {
  title: string;
  notificationsHref: string;
  unreadCount?: number;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/95 px-4 py-3.5 backdrop-blur md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-bold text-[var(--foreground)] md:text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={notificationsHref}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-black/60 hover:bg-black/[0.04]"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 hover:bg-black/[0.04]"
            title="Log out"
          >
            <LogOut size={17} />
          </button>
        </form>
      </div>
    </header>
  );
}
