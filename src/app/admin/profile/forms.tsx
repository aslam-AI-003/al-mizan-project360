"use client";

import { useActionState } from "react";
import { updateProfile, changePassword, type FormState } from "./actions";

function Message({ state }: { state: FormState }) {
  if (state?.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  if (state?.success) return <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{state.success}</p>;
  return null;
}

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label">Name</label>
        <input name="name" required defaultValue={name} className="input" />
      </div>
      <div>
        <label className="label">Email (used to sign in)</label>
        <input name="email" type="email" required defaultValue={email} className="input" />
      </div>
      <div>
        <label className="label">Phone</label>
        <input name="phone" type="tel" defaultValue={phone} className="input" />
      </div>
      <Message state={state} />
      <button type="submit" className="btn-primary" disabled={pending}>Save</button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label">Current Password</label>
        <input name="currentPassword" type="password" required autoComplete="current-password" className="input" />
      </div>
      <div>
        <label className="label">New Password</label>
        <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div>
        <label className="label">Confirm New Password</label>
        <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <Message state={state} />
      <button type="submit" className="btn-primary" disabled={pending}>Change Password</button>
    </form>
  );
}
