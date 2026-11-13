"use server";

import { redirect } from "next/navigation";
import { hasAdmin, MIN_PASSWORD_LENGTH, upsertAdmin } from "@/lib/admin-user";

export type SetupState = { error?: string; email?: string; name?: string };

export async function createFirstAdmin(_prev: SetupState, form: FormData): Promise<SetupState> {
  // The page only works until the first admin exists.
  if (await hasAdmin()) redirect("/sign-in");

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim() || "Admin";
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  const allowed = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (allowed && email !== allowed) return { error: "This email isn't allowed to create the admin account.", email, name };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address.", email, name };
  if (password.length < MIN_PASSWORD_LENGTH) return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters for the password.`, email, name };
  if (password !== confirm) return { error: "The passwords don't match.", email, name };

  await upsertAdmin(email, name, password);
  redirect("/sign-in?setup=done");
}
