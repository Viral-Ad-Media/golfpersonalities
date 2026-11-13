import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { category, post, postCategory } from "@/db/schema";

const published = eq(post.status, "published");

export async function getLatestPosts(limit = 12, offset = 0) {
  return db
    .select()
    .from(post)
    .where(published)
    .orderBy(desc(post.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function countPublished() {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(post).where(published);
  return row?.n ?? 0;
}

export async function getPostBySlug(slug: string, includeDrafts = false) {
  const [row] = await db
    .select()
    .from(post)
    .where(includeDrafts ? eq(post.slug, slug) : and(eq(post.slug, slug), published))
    .limit(1);
  return row ?? null;
}

export async function getCategoriesForPost(postId: number) {
  return db
    .select({ id: category.id, slug: category.slug, name: category.name })
    .from(postCategory)
    .innerJoin(category, eq(postCategory.categoryId, category.id))
    .where(eq(postCategory.postId, postId));
}

export async function getCategories() {
  return db
    .select({
      id: category.id,
      slug: category.slug,
      name: category.name,
      count: sql<number>`count(${post.id}) filter (where ${post.status} = 'published')::int`,
    })
    .from(category)
    .leftJoin(postCategory, eq(postCategory.categoryId, category.id))
    .leftJoin(post, eq(postCategory.postId, post.id))
    .groupBy(category.id)
    .orderBy(category.name);
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db.select().from(category).where(eq(category.slug, slug)).limit(1);
  return row ?? null;
}

export async function getPostsInCategory(categoryId: number) {
  return db
    .select({ post })
    .from(post)
    .innerJoin(postCategory, eq(postCategory.postId, post.id))
    .where(and(eq(postCategory.categoryId, categoryId), published))
    .orderBy(desc(post.publishedAt))
    .then((rows) => rows.map((r) => r.post));
}

export async function getRelatedPosts(postId: number, limit = 3) {
  return db
    .select()
    .from(post)
    .where(and(published, sql`${post.id} <> ${postId}`))
    .orderBy(sql`random()`)
    .limit(limit);
}
