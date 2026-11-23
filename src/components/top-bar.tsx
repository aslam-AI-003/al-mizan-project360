import { LogOut } from "lucide-react";
import { logout } from "@/lib/session-actions";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/95 px-4 py-3.5 backdrop-blur md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-bold text-[var(--foreground)] md:text-lg">{title}</h1>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 hover:bg-black/[0.04]"
          title="Log out"
        >
          <LogOut size={17} />
        </button>
      </form>
    </header>
  );
}
