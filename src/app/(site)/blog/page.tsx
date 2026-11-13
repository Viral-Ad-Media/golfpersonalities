import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PostCard } from "@/components/PostCard";
import { countPublished, getLatestPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "Blog", alternates: { canonical: "/blog" } };

const PAGE_SIZE = 12;

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  await connection();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [posts, total] = await Promise.all([getLatestPosts(PAGE_SIZE, (page - 1) * PAGE_SIZE), countPublished()]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold">All articles</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => (
          <PostCard key={p.id} post={p} priority={i < 3} />
        ))}
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={n === 1 ? "/blog" : `/blog?page=${n}`}
              aria-current={n === page ? "page" : undefined}
              className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold ${n === page ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
