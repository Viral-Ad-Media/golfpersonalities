import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { category, post } from "@/db/schema";
import { SITE_URL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, cats] = await Promise.all([
    db.select({ slug: post.slug, updatedAt: post.updatedAt }).from(post).where(eq(post.status, "published")),
    db.select({ slug: category.slug }).from(category),
  ]);
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily" },
    ...cats.map((c) => ({ url: `${SITE_URL}/category/${c.slug}` })),
    ...posts.map((p) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
