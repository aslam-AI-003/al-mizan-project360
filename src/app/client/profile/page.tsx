import { User, Mail, Phone, Building2, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { getClientContext } from "@/lib/client-data";
import { ChangePasswordForm } from "./change-password-form";

export default async function ClientProfilePage() {
  const { session, project } = await getClientContext();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Profile</h2>
        <p className="text-sm text-black/50">Your account and project details.</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-navy text-lg font-bold text-white">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-[var(--foreground)]">{session.name}</p>
            <p className="text-xs text-black/50">Client</p>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center gap-2.5 text-black/70">
            <Mail size={16} className="shrink-0 text-black/40" />
            {session.email}
          </div>
          {user?.phone && (
            <div className="flex items-center gap-2.5 text-black/70">
              <Phone size={16} className="shrink-0 text-black/40" />
              {user.phone}
            </div>
          )}
        </div>
      </div>

      {project && (
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
            <Building2 size={16} /> Your Project
          </h3>
          <p className="text-sm font-semibold text-[var(--foreground)]">{project.name}</p>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-black/50">
            <MapPin size={15} className="mt-0.5 shrink-0" />
            {project.siteAddress}
          </p>
        </div>
      )}

      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
          <User size={16} /> Change Password
        </h3>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
