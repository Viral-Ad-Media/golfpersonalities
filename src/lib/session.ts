import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Redirects to sign-in unless the current user is an admin. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/sign-in?error=forbidden");
  return session;
}
