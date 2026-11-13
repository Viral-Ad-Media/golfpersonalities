import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PostCard } from "@/components/PostCard";
import { formatDate, SITE_URL } from "@/lib/format";
import { getCategoriesForPost, getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { getSession } from "@/lib/session";

async function loadPost(slug: string) {
  const session = await getSession();
  const isAdmin = session?.user.role === "admin";
  return { post: await getPostBySlug(slug, isAdmin), isAdmin };
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await loadPost(slug);
  if (!post) return {};
  const description = post.seoDescription ?? post.excerpt ?? undefined;
  return {
    title: post.seoTitle ?? post.title,
    description,
    alternates: { canonical: `/${post.slug}` },
    robots: post.status === "published" ? undefined : { index: false },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/[slug]">) {
  await connection();
  const { slug } = await params;
  const { post, isAdmin } = await loadPost(slug);
  if (!post) notFound();

  const [categories, related] = await Promise.all([getCategoriesForPost(post.id), getRelatedPosts(post.id)]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    image: post.featuredImage ? `${SITE_URL}${post.featuredImage}` : undefined,
    mainEntityOfPage: `${SITE_URL}/${post.slug}`,
    publisher: { "@type": "Organization", name: "Golf Personalities" },
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="relative isolate overflow-hidden bg-brand-900 text-white">
        {post.featuredImage && (
          <Image src={post.featuredImage} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-40" />
        )}
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
          {categories.length > 0 && (
            <ul className="mb-4 flex flex-wrap justify-center gap-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="rounded bg-brand-500 px-3 py-1 text-xs font-bold tracking-wide uppercase hover:bg-brand-600"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <h1 className="font-display text-3xl leading-tight font-extrabold text-balance sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-sm text-white/80">
            {post.authorName && <span>{post.authorName} · </span>}
            {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>}
          </p>
        </div>
      </header>

      <div className="relative z-10 mx-auto -mt-10 max-w-3xl px-4">
        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 sm:p-10">
          {post.status !== "published" && (
            <p className="mb-6 rounded-lg bg-sun/40 p-3 text-sm">
              Draft preview, visible to admins only.{" "}
              {isAdmin && (
                <Link className="font-semibold underline" href={`/admin/posts/${post.id}`}>
                  Edit
                </Link>
              )}
            </p>
          )}
          {post.content ? (
            // Content is sanitized on save and on import (src/lib/sanitize.ts).
            <div
              className="prose prose-lg max-w-none prose-headings:font-display prose-a:text-brand-700"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <p className="text-muted">This article hasn&apos;t been restored yet.</p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <h2 className="mb-6 font-display text-2xl font-bold">Keep reading</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
