import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // First visit: no Owner yet, so send them to create one.
  if ((await prisma.user.count({ where: { role: "ADMIN" } })) === 0) redirect("/setup");
  const showDemoCredentials = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--brand-navy)] to-[var(--brand-navy-light)] px-4 py-10 sm:items-center sm:justify-center">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold text-2xl font-bold text-white shadow-lg">
            AM
          </div>
          <h1 className="text-xl font-bold text-white">Al-Mizan Project360</h1>
          <p className="mt-1 text-sm text-white/60">Al-Mizan Building Consortium</p>
        </div>

        <div className="card p-6">
          <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">Sign in</h2>
          <p className="mb-5 text-sm text-black/50">Enter your credentials to continue.</p>
          <LoginForm next={next ?? ""} />
        </div>

        {showDemoCredentials && (
          <div className="mt-5 rounded-2xl border border-dashed border-white/25 bg-white/5 p-4 text-xs text-white/80">
            <p className="mb-2 font-semibold text-white">Demo credentials (development only)</p>
            <ul className="space-y-1">
              <li><span className="text-white/50">Owner:</span> admin@almizan.demo</li>
              <li className="pt-1 text-white/50">Password for all: <span className="text-white">Almizan@123</span></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
