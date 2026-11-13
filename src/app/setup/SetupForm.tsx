"use client";

import { useActionState } from "react";
import { createFirstAdmin, type SetupState } from "./actions";

export function SetupForm() {
  const [state, action, pending] = useActionState<SetupState, FormData>(createFirstAdmin, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" required autoComplete="email" defaultValue={state.email} className="input mt-1" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Name</span>
        <input name="name" type="text" autoComplete="name" defaultValue={state.name} className="input mt-1" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input name="password" type="password" required minLength={10} autoComplete="new-password" className="input mt-1" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Confirm password</span>
        <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className="input mt-1" />
      </label>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? "Creating…" : "Create admin account"}
      </button>
    </form>
  );
}
