import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { post } from "@/db/schema";
import { formatDate } from "@/lib/format";

export default async function AdminHome() {
  const posts = await db
    .select({ id: post.id, title: post.title, slug: post.slug, status: post.status, publishedAt: post.publishedAt, content: post.content })
    .from(post)
    .orderBy(desc(post.publishedAt));
  const missing = posts.filter((p) => !p.content).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Posts ({posts.length})</h1>
        <Link href="/admin/posts/new" className="btn-primary">New post</Link>
      </div>
      {missing > 0 && (
        <p className="mt-4 rounded-lg bg-sun/30 p-3 text-sm">
          {missing} post{missing === 1 ? "" : "s"} still need their article text. Import a WordPress export
          (see the README) or paste the text into each one.
        </p>
      )}
      <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-black/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Text</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-brand-50/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/posts/${p.id}`} className="font-medium hover:text-brand-700">{p.title}</Link>
                  <div className="text-xs text-muted">/{p.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "published" ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-700"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{p.content ? "✓" : <span className="text-red-700">missing</span>}</td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{p.publishedAt ? formatDate(p.publishedAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
