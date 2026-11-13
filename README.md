# Golf Personalities

A rebuild of golfpersonalities.com from the WordPress file backup of 2026-10-19. The stack is Next.js 16 (App Router), Tailwind CSS 4, Neon Postgres (Drizzle ORM) and Better Auth.

None of the WordPress PHP was carried over. The backup was taken from a compromised site: it had obfuscated must-use plugins and PHP backdoors planted in fake post folders. Only images and the post index were reused.

## What came from the backup

| Item | Status |
| --- | --- |
| Post list: 24 URLs with dates and featured images | Recovered from Rank Math's sitemap cache into `content/recovered-posts.json` |
| Categories: Golf, Equipment, Golf Equipment, 19th Hole | Recovered |
| Images: 100 originals | Copied to `public/wp-content/uploads/…`, so the old image URLs still work |
| About 1,096 images from 2022 (Feb, Mar, May, Aug) | **Missing**, because backup part `ad` wasn't available |
| Article text, excerpts, authors, SEO meta | **Missing**, because the backup has no database dump |

The article text lives in the old MySQL database. Export it and run the importer (see below).

## Setup

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run db:migrate        # creates tables in Neon
npm run db:seed           # adds categories and the 24 recovered posts as drafts
npm run create-admin -- you@example.com "Your Name"
npm run dev
```

Sign in at `/sign-in` and manage posts at `/admin`. Public sign-up is turned off, so admin accounts are only created with `create-admin`.

For local development, `DATABASE_URL` can also point at a local Postgres (`postgresql://…@localhost:5432/…`). The app uses node-postgres for localhost URLs and Neon's HTTP driver for everything else.

## Importing the WordPress content

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

1. Create a Neon project and copy the pooled connection string.
2. Import the repo into Vercel and set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` (the last two set to `https://golfpersonalities.com`).
3. Run `npm run db:migrate`, `npm run db:seed`, `npm run create-admin` and `npm run import:wp` once against the production `DATABASE_URL`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run typecheck` | Generates route types and runs `tsc` |
| `npm run db:generate` | Creates a migration after schema changes |
| `npm run db:migrate` | Applies migrations |
| `npm run db:seed` | Seeds categories and recovered post drafts |
| `npm run create-admin` | Creates or resets an admin user (reads the password from `ADMIN_PASSWORD` or prompts for it) |
| `npm run import:wp` | Imports a WordPress `.sql` or `.xml` export |
