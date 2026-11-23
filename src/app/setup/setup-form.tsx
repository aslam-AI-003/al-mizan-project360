"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createOwner } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Creating account..." : "Create Owner Account"}
    </button>
  );
}

export function SetupForm({ needsCode }: { needsCode: boolean }) {
  const [state, formAction] = useActionState(createOwner, null);
  return (
    <form action={formAction} className="space-y-4">
      {needsCode && (
        <div>
          <label className="label" htmlFor="setupCode">Setup Code</label>
          <input id="setupCode" name="setupCode" type="password" required className="input" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="name">Your Name</label>
        <input id="name" name="name" type="text" required autoComplete="name" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
