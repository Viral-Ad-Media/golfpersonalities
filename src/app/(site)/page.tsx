import Link from "next/link";
import { connection } from "next/server";
import { PostCard } from "@/components/PostCard";
import { getCategories, getLatestPosts } from "@/lib/posts";

export default async function HomePage() {
  await connection();
  const [posts, categories] = await Promise.all([getLatestPosts(10), getCategories()]);
  const [lead, ...rest] = posts;

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-10 sm:pt-20">
          <p className="text-sm font-semibold tracking-widest text-brand-600 uppercase">Golf Personalities</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight font-extrabold text-ink sm:text-5xl">
            The people, stories and traditions behind the game.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Player profiles, tour life, golf culture and honest gear guides.
          </p>
          {categories.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm ring-1 ring-black/5 hover:ring-brand-500"
                  >
                    {c.name}
                    <span className="text-xs text-muted">{c.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        {posts.length === 0 ? (
          <p className="rounded-2xl bg-brand-50 p-8 text-center text-muted">
            No published articles yet. Sign in to the admin to publish the restored posts.
          </p>
        ) : (
          <>
            {lead && (
              <div className="mb-10 grid gap-6">
                <PostCard post={lead} priority featured />
              </div>
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/blog" className="inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
                All articles
              </Link>
            </div>
          </>
        )}
      </section>
    </>
  );
}
