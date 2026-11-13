import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PostCard } from "@/components/PostCard";
import { getCategoryBySlug, getPostsInCategory } from "@/lib/posts";

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  return cat ? { title: cat.name, alternates: { canonical: `/category/${cat.slug}` } } : {};
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  await connection();
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const posts = await getPostsInCategory(cat.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-semibold tracking-widest text-brand-600 uppercase">Category</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">{cat.name}</h1>
      {cat.description && <p className="mt-3 max-w-2xl text-muted">{cat.description}</p>}
      {posts.length === 0 ? (
        <p className="mt-8 text-muted">No published articles in this category yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
