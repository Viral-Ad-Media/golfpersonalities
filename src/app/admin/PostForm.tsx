"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Category, Post } from "@/db/schema";
import type { FormState } from "./actions";

type Props = {
  post?: Post;
  categories: Category[];
  selected: number[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  saved?: boolean;
};

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function PostForm({ post, categories, selected, action, saved }: Props) {
  const [state, formAction, pending] = useActionState(action, saved ? { ok: true } : {});
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input
            name="title"
            required
            defaultValue={post?.title}
            className="input mt-1 text-lg"
            onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Slug</span>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="input mt-1 font-mono"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Content (HTML)</span>
          <textarea name="content" defaultValue={post?.content} rows={24} className="input mt-1 font-mono text-xs" />
          <span className="mt-1 block text-xs text-muted">Scripts, inline styles and unknown embeds are removed when you save.</span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Excerpt</span>
          <textarea name="excerpt" defaultValue={post?.excerpt ?? ""} rows={3} className="input mt-1" />
          <span className="mt-1 block text-xs text-muted">Leave empty to generate one from the content.</span>
        </label>
      </div>

      <aside className="space-y-4">
        <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-black/10">
          <label className="block">
            <span className="text-sm font-medium">Status</span>
            <select name="status" defaultValue={post?.status ?? "draft"} className="input mt-1">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Publish date</span>
            <input
              type="datetime-local"
              name="publishedAt"
              defaultValue={post?.publishedAt ? post.publishedAt.toISOString().slice(0, 16) : ""}
              className="input mt-1"
            />
          </label>
          {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
          {state.ok && !pending && <p role="status" className="text-sm text-brand-700">Saved.</p>}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
            {post && (
              <Link href={`/${post.slug}`} className="btn-secondary" target="_blank">
                View
              </Link>
            )}
          </div>
        </div>

        <fieldset className="rounded-xl bg-white p-4 ring-1 ring-black/10">
          <legend className="px-1 text-sm font-medium">Categories</legend>
          {categories.map((c) => (
            <label key={c.id} className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={selected.includes(c.id)} />
              {c.name}
            </label>
          ))}
        </fieldset>

        <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-black/10">
          <label className="block">
            <span className="text-sm font-medium">Featured image</span>
            <input name="featuredImage" defaultValue={post?.featuredImage ?? ""} placeholder="/wp-content/uploads/…" className="input mt-1" />
          </label>
          {post?.featuredImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.featuredImage} alt="" className="aspect-video w-full rounded-lg object-cover" />
          )}
        </div>

        <div className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-black/10">
          <label className="block">
            <span className="text-sm font-medium">SEO title</span>
            <input name="seoTitle" defaultValue={post?.seoTitle ?? ""} className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Meta description</span>
            <textarea name="seoDescription" defaultValue={post?.seoDescription ?? ""} rows={3} className="input mt-1" />
          </label>
        </div>
      </aside>
    </form>
  );
}
