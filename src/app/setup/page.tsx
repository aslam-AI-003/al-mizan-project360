import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // Only available until the first Owner exists.
  if ((await prisma.user.count({ where: { role: "ADMIN" } })) > 0) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--brand-navy)] to-[var(--brand-navy-light)] px-4 py-10 sm:items-center sm:justify-center">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold text-2xl font-bold text-white shadow-lg">
            AM
          </div>
          <h1 className="text-xl font-bold text-white">Welcome to Project360</h1>
          <p className="mt-1 text-sm text-white/60">Create the Owner account to get started.</p>
        </div>
        <div className="card p-6">
          <SetupForm needsCode={Boolean(process.env.SETUP_CODE)} />
        </div>
      </div>
    </div>
  );
}
