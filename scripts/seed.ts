/**
 * Seeds categories and the post list recovered from the file backup
 * (content/recovered-posts.json). Posts are created as drafts with an empty
 * body, because the backup did not include the database. Run
 * `npm run import:wp` afterwards to fill in the article text.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { category, post } from "../src/db/schema";

type Recovered = {
  posts: { slug: string; title: string; updatedAt: string | null; featuredImage: string | null }[];
  categories: { slug: string; name: string }[];
};

const NAMES: Record<string, string> = { "19th-hole": "19th Hole", golf: "Golf", equipment: "Equipment", "golf-equipment": "Golf Equipment" };

async function main() {
  const data: Recovered = JSON.parse(readFileSync(new URL("../content/recovered-posts.json", import.meta.url), "utf8"));

  for (const c of data.categories) {
    await db.insert(category).values({ slug: c.slug, name: NAMES[c.slug] ?? c.name }).onConflictDoNothing();
  }

  let created = 0;
  for (const p of data.posts) {
    const [existing] = await db.select({ id: post.id }).from(post).where(eq(post.slug, p.slug));
    if (existing) continue;
    await db.insert(post).values({
      slug: p.slug,
      title: p.title,
      featuredImage: p.featuredImage,
      status: "draft",
      publishedAt: p.updatedAt ? new Date(p.updatedAt) : null,
    });
    created++;
  }
  console.log(`Categories: ${data.categories.length}. Posts created: ${created} (existing ones left untouched).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
