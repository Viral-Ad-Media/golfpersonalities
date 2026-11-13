import Link from "next/link";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/category/golf", label: "Golf" },
  { href: "/category/golf-equipment", label: "Equipment" },
  { href: "/category/19th-hole", label: "19th Hole" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link href="/" className="text-brand-600" aria-label="Golf Personalities home">
          <Logo className="text-ink [&_svg]:text-brand-500" />
        </Link>
        <nav aria-label="Main" className="-mx-3 overflow-x-auto sm:mx-0 sm:-mr-2">
          <ul className="flex items-center gap-1 text-sm font-medium whitespace-nowrap">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-3 py-2 text-muted transition hover:bg-brand-50 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
