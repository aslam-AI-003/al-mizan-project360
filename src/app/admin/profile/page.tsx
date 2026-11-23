import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm, PasswordForm } from "./forms";

export default async function ProfilePage() {
  const session = await getSession();
  const user = session ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;
  if (!user) redirect("/login");

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-lg font-bold text-[var(--foreground)]">Profile</h2>
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Your Details</h3>
        <ProfileForm name={user.name} email={user.email} phone={user.phone ?? ""} />
      </div>
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">Change Password</h3>
        <PasswordForm />
      </div>
    </div>
  );
}
