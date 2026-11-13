# Golf Personalities

A rebuild of golfpersonalities.com from the WordPress file backup of 2026-10-19. The stack is Next.js 16 (App Router), Tailwind CSS 4, Neon Postgres (Drizzle ORM) and Better Auth.

None of the WordPress PHP was carried over. The backup was taken from a compromised site: it had obfuscated must-use plugins and PHP backdoors planted in fake post folders. Only images and the post index were reused.

## What came from the backup

| Item | Status |
| --- | --- |
| Post list: 24 URLs with dates and featured images | Recovered from Rank Math's sitemap cache into `content/recovered-posts.json` |
| Categories: Golf, Golf Equipment, 19th Hole | Recovered (the empty "Equipment" category was dropped) |
| Images: 100 originals | Copied to `public/wp-content/uploads/…`, so the old image URLs still work |
| About 1,096 images from 2022 (Feb, Mar, May, Aug) | **Missing**, because backup part `ad` wasn't available |
| Article text, excerpts, authors, SEO meta | **Missing**, because the backup has no database dump |

Because no database export was available, the article text was **newly written** for all 24 posts. It lives in `content/articles/<slug>.html`, and each file starts with a header comment that sets the title, category and excerpt. The articles are factual overviews written without access to the originals, so review them before relying on specific facts. If the old database ever turns up, the importer below can still bring back the original text.

## Setup

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run db:migrate        # creates tables in Neon
npm run db:seed           # adds categories and publishes the 24 articles
npm run create-admin -- you@example.com "Your Name"
npm run dev
```

Sign in at `/sign-in` and manage posts at `/admin`. Public sign-up is turned off, so admin accounts are only created with `create-admin`.

For local development, `DATABASE_URL` can also point at a local Postgres (`postgresql://…@localhost:5432/…`). The app uses node-postgres for localhost URLs and Neon's HTTP driver for everything else.

## Editing the seeded articles

Edit a post in `/admin`, or edit its file in `content/articles/` and run `npm run db:seed -- --force`. Without `--force`, the seed only fills posts whose body is still empty, so admin edits are never overwritten.

## Importing the WordPress content (optional)

Export the old database from your host's phpMyAdmin (Export > SQL) or from WordPress (Tools > Export > Posts). Then run:

```bash
npm run import:wp -- ./golfpersonalities.sql
# or
npm run import:wp -- ./wordpress-export.xml
```

- It matches posts by WordPress ID, then by slug, so it fills in the seeded drafts and is safe to run again.
- It reads `post_content`, and falls back to Elementor's `_elementor_data` for pages built with Elementor. It also brings over categories, featured images, authors and Rank Math descriptions.
- All HTML is sanitized: scripts, event handlers, inline styles and unknown iframes are removed. Old `https://golfpersonalities.com/...` links are made relative.
- Imported posts stay **drafts** so you can review them, because the old site was hacked. When the import finishes, it lists every external link host it found, which makes injected spam links easy to spot. Add `--publish` to keep each post's WordPress publish status.

## Routes

- `/`: home page
- `/blog`: all articles, paginated
- `/category/[slug]`: articles in one category
- `/[slug]`: an article (same URLs as WordPress). Old `/YYYY/MM/DD/slug` links redirect here.
- `/admin`: post list, editor, publish/draft, categories, SEO fields (admins only)
- `/sitemap.xml` and `/robots.txt`

## Deploying (Vercel)

The build itself doesn't need a database, so it succeeds even before the variables are set. Pages that read posts need them at runtime.

1. Create a Neon project and copy the **pooled** connection string (Neon console > Connect).
2. In Vercel, go to Settings > Environment Variables and add these for Production (and Preview if you use it):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | The Neon pooled connection string |
   | `BETTER_AUTH_SECRET` | A random string from `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | `https://golfpersonalities.com` |
   | `NEXT_PUBLIC_SITE_URL` | `https://golfpersonalities.com` |

3. Redeploy so the variables take effect.
4. Deploy. When `DATABASE_URL` is set, Vercel's build (`npm run vercel-build`) applies any new migrations and runs the seed before `next build`. The seed only fills posts that are empty, so it never overwrites edits made in the admin.
5. Create the admin account: open `/setup` on the live site and choose an email and password. The page only works until the first admin exists, then it returns 404. To restrict it to one address, set `ADMIN_EMAIL` in Vercel. Do this right after deploying.
6. Alternatively, create an admin from your computer, with `DATABASE_URL` in `.env` set to the same Neon URL. You can also run the first two commands by hand if you prefer:

   ```bash
   npm run db:migrate
   npm run db:seed
   npm run create-admin -- you@example.com "Your Name"
   ```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run typecheck` | Generates route types and runs `tsc` |
| `npm run db:generate` | Creates a migration after schema changes |
| `npm run db:migrate` | Applies migrations |
| `npm run db:seed` | Seeds categories and the articles in `content/articles/` (`--force` overwrites) |
| `npm run create-admin` | Creates or resets an admin user (reads the password from `ADMIN_PASSWORD` or prompts for it) |
| `npm run import:wp` | Imports a WordPress `.sql` or `.xml` export |
