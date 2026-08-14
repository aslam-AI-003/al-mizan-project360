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
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="currentPassword">Current Password</label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="input"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="label" htmlFor="newPassword">New Password</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className="input"
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">Confirm New Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="input"
          placeholder="••••••••"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-[var(--status-success-bg)] px-3 py-2 text-sm text-[var(--status-success)]">
          {state.success}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
