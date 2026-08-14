"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePassword } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Updating..." : "Update Password"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, null);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="label">Current Password</label>
        <input type="password" name="currentPassword" required autoComplete="current-password" className="input" />
      </div>
      <div>
        <label className="label">New Password</label>
        <input type="password" name="newPassword" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div>
        <label className="label">Confirm New Password</label>
        <input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
