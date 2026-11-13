import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/session";
import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin"><Logo /></Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-muted hover:text-ink">View site</Link>
            <span className="hidden text-muted sm:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
