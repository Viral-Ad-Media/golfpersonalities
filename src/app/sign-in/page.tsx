import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { error } = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center bg-brand-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
        <Link href="/" className="block text-center">
          <Logo />
        </Link>
        <h1 className="mt-6 text-center font-display text-xl font-bold">Admin sign in</h1>
        {error === "forbidden" && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">That account doesn&apos;t have admin access.</p>
        )}
        <SignInForm />
      </div>
    </div>
  );
}
