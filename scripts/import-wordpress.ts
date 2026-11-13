/**
 * Imports posts from the old WordPress site into Neon.
 *
 *   npm run import:wp -- path/to/database.sql     (phpMyAdmin / mysqldump export)
 *   npm run import:wp -- path/to/export.xml       (WordPress Tools > Export)
 *
 * Add --publish to publish every post that was published on WordPress.
 * Without it, imported posts keep their text but stay drafts so you can
 * review them first (the old site was compromised).
 *
 * Posts are matched by WordPress ID, then by slug, so re-running is safe and
 * fills in the drafts created by `npm run db:seed`.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import { db } from "../src/db";
import { category, post, postCategory } from "../src/db/schema";
import { makeExcerpt, relativizeSiteUrls, sanitizePostHtml } from "../src/lib/sanitize";
import { cleanWpContent, elementorToHtml } from "./wp/content";
import { detectPrefix, readWpTables } from "./wp/sql";

type Imported = {
  wpId: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  status: "draft" | "published";
  date: Date | null;
  author: string | null;
  categories: { slug: string; name: string }[];
  featuredImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&#0?39;|&#8217;/g, "’").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Rank Math stores templates like "%title% %sep% %sitename%"; keep only literal values. */
const literal = (v: string | null | undefined) => (v && !v.includes("%") ? v : null);

function parseDate(gmt: string | null | undefined, local: string | null | undefined) {
  const v = gmt && !gmt.startsWith("0000") ? `${gmt}Z` : local && !local.startsWith("0000") ? local : null;
  return v ? new Date(v.replace(" ", "T")) : null;
}

function bodyFor(raw: string, elementorData: string | undefined) {
  const fromContent = cleanWpContent(raw ?? "");
  const textLen = fromContent.replace(/<[^>]+>/g, "").trim().length;
  if (elementorData && textLen < 200) {
    const fromElementor = elementorToHtml(elementorData);
    if (fromElementor.replace(/<[^>]+>/g, "").trim().length > textLen) return fromElementor;
  }
  return fromContent;
}

function fromSql(dump: string): Imported[] {
  const prefix = detectPrefix(dump);
  const t = readWpTables(dump, prefix);
  console.log(`Table prefix: ${prefix}. Rows found: ${Object.entries(t).map(([k, v]) => `${k}=${v.length}`).join(", ")}`);
  const posts = t.posts ?? [];

  const meta = new Map<string, Record<string, string>>();
  for (const m of t.postmeta ?? []) {
    if (!m.post_id || !m.meta_key) continue;
    (meta.get(m.post_id) ?? meta.set(m.post_id, {}).get(m.post_id)!)[m.meta_key] = m.meta_value ?? "";
  }
  const attachmentUrl = new Map(posts.filter((p) => p.post_type === "attachment").map((p) => [p.ID!, p.guid ?? ""]));
  const users = new Map((t.users ?? []).map((u) => [u.ID!, u.display_name ?? u.user_login ?? ""]));
  const terms = new Map((t.terms ?? []).map((x) => [x.term_id!, x]));
  const taxToTerm = new Map(
    (t.term_taxonomy ?? []).filter((x) => x.taxonomy === "category").map((x) => [x.term_taxonomy_id!, terms.get(x.term_id!)]),
  );
  const postCats = new Map<string, { slug: string; name: string }[]>();
  for (const r of t.term_relationships ?? []) {
    const term = taxToTerm.get(r.term_taxonomy_id!);
    if (!term || term.slug === "uncategorized") continue;
    (postCats.get(r.object_id!) ?? postCats.set(r.object_id!, []).get(r.object_id!)!).push({
      slug: term.slug!,
      name: decode(term.name ?? term.slug!),
    });
  }

  return posts
    .filter((p) => p.post_type === "post" && ["publish", "draft", "future", "private"].includes(p.post_status ?? ""))
    .map((p) => {
      const m = meta.get(p.ID!) ?? {};
      const featuredRaw = m._thumbnail_id ? attachmentUrl.get(m._thumbnail_id) : undefined;
      return {
        wpId: Number(p.ID),
        slug: p.post_name || `post-${p.ID}`,
        title: decode(p.post_title ?? ""),
        content: bodyFor(p.post_content ?? "", m._elementor_data),
        excerpt: p.post_excerpt ?? "",
        status: p.post_status === "publish" ? "published" : "draft",
        date: parseDate(p.post_date_gmt, p.post_date),
        author: users.get(p.post_author ?? "") || null,
        categories: postCats.get(p.ID!) ?? [],
        featuredImage: featuredRaw ? relativizeSiteUrls(featuredRaw) : null,
        seoTitle: literal(m.rank_math_title),
        seoDescription: literal(m.rank_math_description),
      } satisfies Imported;
    });
}

function fromWxr(xml: string): Imported[] {
  const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: false, parseTagValue: false, isArray: (n) => ["item", "category", "wp:postmeta"].includes(n) });
  const doc = parser.parse(xml);
  const items: Record<string, unknown>[] = doc?.rss?.channel?.item ?? [];
  const str = (v: unknown) => (v == null ? "" : typeof v === "object" && "#text" in (v as object) ? String((v as { "#text": unknown })["#text"]) : String(v));
  const metaOf = (it: Record<string, unknown>) =>
    Object.fromEntries(((it["wp:postmeta"] as Record<string, unknown>[]) ?? []).map((m) => [str(m["wp:meta_key"]), str(m["wp:meta_value"])]));
  const attachments = new Map(
    items.filter((it) => str(it["wp:post_type"]) === "attachment").map((it) => [str(it["wp:post_id"]), str(it["wp:attachment_url"])]),
  );

  return items
    .filter((it) => str(it["wp:post_type"]) === "post" && ["publish", "draft", "future", "private"].includes(str(it["wp:status"])))
    .map((it) => {
      const m = metaOf(it);
      const cats = ((it.category as Record<string, string>[]) ?? [])
        .filter((c) => c["@_domain"] === "category" && c["@_nicename"] !== "uncategorized")
        .map((c) => ({ slug: c["@_nicename"], name: decode(str(c)) }));
      const featuredRaw = m._thumbnail_id ? attachments.get(m._thumbnail_id) : undefined;
      return {
        wpId: Number(str(it["wp:post_id"])),
        slug: str(it["wp:post_name"]) || `post-${str(it["wp:post_id"])}`,
        title: decode(str(it.title)),
        content: bodyFor(str(it["content:encoded"]), m._elementor_data),
        excerpt: str(it["excerpt:encoded"]),
        status: str(it["wp:status"]) === "publish" ? "published" : "draft",
        date: parseDate(str(it["wp:post_date_gmt"]), str(it["wp:post_date"])),
        author: str(it["dc:creator"]) || null,
        categories: cats,
        featuredImage: featuredRaw ? relativizeSiteUrls(featuredRaw) : null,
        seoTitle: literal(m.rank_math_title),
        seoDescription: literal(m.rank_math_description),
      } satisfies Imported;
    });
}

async function ensureCategory(c: { slug: string; name: string }) {
  await db.insert(category).values(c).onConflictDoNothing();
  const [row] = await db.select({ id: category.id }).from(category).where(eq(category.slug, c.slug));
  return row.id;
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const publish = args.includes("--publish");
  if (!file) throw new Error("Usage: npm run import:wp -- <export.sql|export.xml> [--publish]");

  const raw = readFileSync(file, "utf8");
  const imported = /<rss[\s>]/.test(raw.slice(0, 2000)) ? fromWxr(raw) : fromSql(raw);
  console.log(`Found ${imported.length} posts in ${file}`);

  const externalHosts = new Map<string, number>();
  let created = 0;
  let updated = 0;

  for (const p of imported) {
    const content = sanitizePostHtml(p.content);
    for (const [, host] of content.matchAll(/href="https?:\/\/([^/"]+)/g)) externalHosts.set(host, (externalHosts.get(host) ?? 0) + 1);

    const values = {
      wpId: p.wpId,
      slug: p.slug,
      title: p.title || p.slug,
      content,
      excerpt: (p.excerpt && makeExcerpt(p.excerpt, 60)) || (content ? makeExcerpt(content) : null),
      status: publish ? p.status : "draft",
      publishedAt: p.date,
      authorName: p.author,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      updatedAt: new Date(),
    };

    const [byWp] = await db.select({ id: post.id, featuredImage: post.featuredImage }).from(post).where(eq(post.wpId, p.wpId));
    const [bySlug] = byWp ? [] : await db.select({ id: post.id, featuredImage: post.featuredImage }).from(post).where(eq(post.slug, p.slug));
    const existing = byWp ?? bySlug;

    let id: number;
    if (existing) {
      await db
        .update(post)
        .set({
          ...values,
          // Without --publish, leave the current status alone (don't unpublish reviewed posts).
          status: publish ? values.status : undefined,
          featuredImage: p.featuredImage ?? existing.featuredImage,
        })
        .where(eq(post.id, existing.id));
      id = existing.id;
      updated++;
    } else {
      const [row] = await db.insert(post).values({ ...values, featuredImage: p.featuredImage }).returning({ id: post.id });
      id = row.id;
      created++;
    }

    if (p.categories.length) {
      await db.delete(postCategory).where(eq(postCategory.postId, id));
      for (const c of p.categories) {
        await db.insert(postCategory).values({ postId: id, categoryId: await ensureCategory(c) }).onConflictDoNothing();
      }
    }
  }

  console.log(`Created ${created}, updated ${updated}.${publish ? "" : " All imported posts are drafts; re-run with --publish or publish them in /admin."}`);
  if (externalHosts.size) {
    console.log("\nExternal link hosts found in post content (check for spam links the hack may have injected):");
    for (const [host, n] of [...externalHosts].sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${host}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
