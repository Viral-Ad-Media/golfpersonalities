import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Logo } from "@/components/Logo";
import { hasAdmin } from "@/lib/admin-user";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "Set up admin", robots: { index: false } };

/** One-time page for creating the first admin. It disappears once an admin exists. */
export default async function SetupPage() {
  await connection();
  if (await hasAdmin()) notFound();
  return (
    <div className="grid min-h-screen place-items-center bg-brand-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
        <Link href="/" className="block text-center">
          <Logo />
        </Link>
        <h1 className="mt-6 text-center font-display text-xl font-bold">Create the admin account</h1>
        <p className="mt-2 text-center text-sm text-muted">This page works once. After the first admin is created, it&apos;s switched off.</p>
        <SetupForm />
      </div>
    </div>
  );
}
