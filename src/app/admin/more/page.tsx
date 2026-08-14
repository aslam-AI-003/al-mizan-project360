import Link from "next/link";
import { Users, Truck, ScrollText, Bell, Search, Building2, User as UserIcon, HardHat } from "lucide-react";
import { prisma } from "@/lib/db";

const LINKS = [
  { href: "/admin/workers", label: "Workers", description: "Worker master and attendance wages", icon: Users },
  { href: "/admin/suppliers", label: "Suppliers", description: "Supplier master and outstanding dues", icon: Truck },
  { href: "/admin/audit-log", label: "Audit Log", description: "System-wide activity trail", icon: ScrollText },
  { href: "/admin/notifications", label: "Notifications", description: "Your alerts and updates", icon: Bell },
];

export default async function MorePage(props: PageProps<"/admin/more">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const results = q
    ? await Promise.all([
        prisma.project.findMany({ where: { name: { contains: q } }, take: 8, select: { id: true, name: true } }),
        prisma.user.findMany({
          where: { name: { contains: q }, role: { in: ["CLIENT", "SUPERVISOR"] } },
          take: 8,
          select: { id: true, name: true, role: true },
        }),
        prisma.supplier.findMany({ where: { name: { contains: q } }, take: 8, select: { id: true, name: true } }),
        prisma.worker.findMany({ where: { name: { contains: q } }, take: 8, select: { id: true, name: true, workerCode: true } }),
      ])
    : null;

  const [projects, people, suppliers, workers] = results ?? [[], [], [], []];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">More</h2>
        <p className="text-sm text-black/50">Additional tools and search.</p>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search projects, people, suppliers, workers…"
          className="input"
        />
        <button type="submit" className="btn-primary shrink-0">
          <Search size={16} />
        </button>
      </form>

      {q && (
        <div className="space-y-4">
          {projects.length === 0 && people.length === 0 && suppliers.length === 0 && workers.length === 0 ? (
            <p className="text-sm text-black/40">No results for &quot;{q}&quot;.</p>
          ) : (
            <>
              {projects.length > 0 && (
                <ResultGroup title="Projects" icon={Building2}>
                  {projects.map((p) => (
                    <Link key={p.id} href={`/admin/projects/${p.id}`} className="block px-4 py-2.5 text-sm hover:bg-black/[0.02]">
                      {p.name}
                    </Link>
                  ))}
                </ResultGroup>
              )}
              {people.length > 0 && (
                <ResultGroup title="People" icon={UserIcon}>
                  {people.map((u) => (
                    <p key={u.id} className="px-4 py-2.5 text-sm">
                      {u.name} <span className="text-black/40">({u.role})</span>
                    </p>
                  ))}
                </ResultGroup>
              )}
              {suppliers.length > 0 && (
                <ResultGroup title="Suppliers" icon={Truck}>
                  {suppliers.map((s) => (
                    <Link key={s.id} href={`/admin/suppliers/${s.id}`} className="block px-4 py-2.5 text-sm hover:bg-black/[0.02]">
                      {s.name}
                    </Link>
                  ))}
                </ResultGroup>
              )}
              {workers.length > 0 && (
                <ResultGroup title="Workers" icon={HardHat}>
                  {workers.map((w) => (
                    <p key={w.id} className="px-4 py-2.5 text-sm">
                      {w.name} <span className="text-black/40">({w.workerCode})</span>
                    </p>
                  ))}
                </ResultGroup>
              )}
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="card flex items-center gap-3 p-4 transition hover:border-brand-navy/20">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
              <link.icon size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">{link.label}</p>
              <p className="text-xs text-black/50">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ResultGroup({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-black/50">
        <Icon size={13} /> {title}
      </div>
      <div className="card divide-y divide-black/5">{children}</div>
    </div>
  );
}
