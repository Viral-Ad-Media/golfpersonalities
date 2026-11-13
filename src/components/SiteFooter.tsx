import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-brand-600 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center">
        <Logo className="[&_span_span]:text-sun" />
        <p className="max-w-xl text-sm text-white/85">
          Stories about the people who make golf interesting: the pros, their families, the legends,
          and the gear and traditions around the game.
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/90">
            <li><Link className="hover:underline" href="/blog">All articles</Link></li>
            <li><Link className="hover:underline" href="/category/golf">Golf</Link></li>
            <li><Link className="hover:underline" href="/category/golf-equipment">Equipment</Link></li>
            <li><Link className="hover:underline" href="/category/19th-hole">19th Hole</Link></li>
          </ul>
        </nav>
        <p className="text-xs text-white/70">© {new Date().getFullYear()} Golf Personalities. All rights reserved.</p>
      </div>
    </footer>
  );
}
