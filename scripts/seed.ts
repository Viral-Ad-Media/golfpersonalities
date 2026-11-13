/**
 * Seeds the site's categories and articles.
 *
 * Article text lives in content/articles/<slug>.html. Each file starts with a
 * header comment holding the title, category and excerpt:
 *
 *   <!--
 *   title: Best Golf Gifts for Golfers
 *   category: golf-equipment
 *   excerpt: Shopping for a golfer? ...
 *   -->
 *
 * Dates and featured images come from content/recovered-posts.json, the post
 * list recovered from the old site's file backup.
 *
 * By default the script only fills posts whose body is still empty, so edits
 * made in the admin are never overwritten. Pass --force to overwrite them.
 *
 *   npm run db:seed
 *   npm run db:seed -- --force
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { category, post, postCategory } from "../src/db/schema";
import { sanitizePostHtml } from "../src/lib/sanitize";

type Recovered = {
  posts: { slug: string; title: string; updatedAt: string | null; featuredImage: string | null }[];
};

const CATEGORIES: { slug: string; name: string }[] = [
  { slug: "golf", name: "Golf" },
  { slug: "19th-hole", name: "19th Hole" },
  { slug: "golf-equipment", name: "Golf Equipment" },
];

const force = process.argv.includes("--force");
const articlesDir = new URL("../content/articles/", import.meta.url);

function parseArticle(file: string) {
  const raw = readFileSync(new URL(file, articlesDir), "utf8");
  const m = raw.match(/^\s*<!--([\s\S]*?)-->/);
  if (!m) throw new Error(`${file}: missing header comment`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  if (!meta.title || !meta.category) throw new Error(`${file}: header needs title and category`);
  const body = raw.slice(m[0].length).trim();
  const firstImg = body.match(/<img[^>]+src="([^"]+)"/)?.[1] ?? null;
  return { slug: file.replace(/\.html$/, ""), title: meta.title, category: meta.category, excerpt: meta.excerpt || null, body, firstImg };
}

async function main() {
  const recovered: Recovered = JSON.parse(readFileSync(new URL("../content/recovered-posts.json", import.meta.url), "utf8"));
  const bySlug = new Map(recovered.posts.map((p) => [p.slug, p]));

  const catIds = new Map<string, number>();
  for (const c of CATEGORIES) {
    await db.insert(category).values(c).onConflictDoNothing();
    const [row] = await db.select({ id: category.id }).from(category).where(eq(category.slug, c.slug));
    catIds.set(c.slug, row.id);
  }

  const files = readdirSync(articlesDir).filter((f) => f.endsWith(".html")).sort();
  let created = 0, updated = 0, skipped = 0;

  for (const file of files) {
    const a = parseArticle(file);
    const catId = catIds.get(a.category);
    if (!catId) throw new Error(`${file}: unknown category "${a.category}"`);
    const rec = bySlug.get(a.slug);
    const content = sanitizePostHtml(a.body);
    const featuredImage = rec?.featuredImage ?? a.firstImg;
    const publishedAt = rec?.updatedAt ? new Date(rec.updatedAt) : new Date();

    const [existing] = await db.select({ id: post.id, content: post.content }).from(post).where(eq(post.slug, a.slug));
    let postId: number;
    if (!existing) {
      const [row] = await db
        .insert(post)
        .values({ slug: a.slug, title: a.title, excerpt: a.excerpt, content, featuredImage, status: "published", publishedAt })
        .returning({ id: post.id });
      postId = row.id;
      created++;
    } else if (force || !existing.content.trim()) {
      await db
        .update(post)
        .set({ title: a.title, excerpt: a.excerpt, content, featuredImage, status: "published", publishedAt, updatedAt: new Date() })
        .where(eq(post.id, existing.id));
      postId = existing.id;
      updated++;
    } else {
      skipped++;
      continue;
    }

    await db.delete(postCategory).where(eq(postCategory.postId, postId));
    await db.insert(postCategory).values({ postId, categoryId: catId });
  }

  // The old site had an unused "equipment" category; remove it if empty.
  const [old] = await db.select({ id: category.id }).from(category).where(eq(category.slug, "equipment"));
  if (old) {
    const [used] = await db.select().from(postCategory).where(and(eq(postCategory.categoryId, old.id))).limit(1);
    if (!used) await db.delete(category).where(eq(category.id, old.id));
  }

  console.log(`Articles: ${files.length}. Created ${created}, updated ${updated}, left alone ${skipped}${skipped ? " (already have text; use --force to overwrite)" : ""}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
