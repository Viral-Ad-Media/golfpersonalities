import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
    <SiteHeader />
    <main className="mx-auto max-w-xl flex-1 px-4 py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">That one landed in the rough.</h1>
      <p className="mt-2 text-muted">We couldn&apos;t find the page you were looking for.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
        Back to the clubhouse
      </Link>
    </main>
    <SiteFooter />
    </>
  );
}
