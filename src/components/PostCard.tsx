import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { makeExcerpt } from "@/lib/sanitize";

export function PostCard({ post, priority = false, featured = false }: { post: Post; priority?: boolean; featured?: boolean }) {
  const excerpt = post.excerpt || (post.content ? makeExcerpt(post.content, featured ? 50 : 28) : null);
  return (
    <article className={`group flex flex-col ${featured ? "md:grid md:grid-cols-[3fr_2fr]" : ""} overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md`}>
      <Link href={`/${post.slug}`} className={`relative block aspect-[16/10] bg-brand-50 ${featured ? "md:aspect-auto md:min-h-80" : ""}`}>
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt=""
            fill
            priority={priority}
            sizes={featured ? "(min-width: 768px) 60vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display text-4xl text-brand-500/40">⛳</span>
        )}
      </Link>
      <div className={`flex flex-1 flex-col gap-2 p-5 ${featured ? "md:justify-center md:p-8" : ""}`}>
        {post.publishedAt && (
          <time className="text-xs font-semibold uppercase tracking-wide text-brand-600" dateTime={post.publishedAt.toISOString()}>
            {formatDate(post.publishedAt)}
          </time>
        )}
        <h3 className={`font-display leading-snug font-bold text-ink ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}>
          <Link href={`/${post.slug}`} className="hover:text-brand-700">
            {post.title}
          </Link>
        </h3>
        {excerpt && <p className={`text-muted ${featured ? "line-clamp-5" : "line-clamp-3 text-sm"}`}>{excerpt}</p>}
      </div>
    </article>
  );
}
