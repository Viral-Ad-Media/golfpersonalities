"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { post, postCategory } from "@/db/schema";
import { sanitizePostHtml } from "@/lib/sanitize";
import { requireAdmin } from "@/lib/session";

const PostInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only use lowercase letters, numbers and dashes"),
  excerpt: z.string().trim().max(600).optional(),
  content: z.string().max(500_000),
  featuredImage: z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v), "Use a /path or https:// URL")
    .optional(),
  status: z.enum(["draft", "published"]),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  publishedAt: z.string().optional(),
  categoryIds: z.array(z.coerce.number().int()).default([]),
});

export type FormState = { error?: string; ok?: boolean };

function parse(formData: FormData) {
  return PostInput.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") ?? undefined,
    content: formData.get("content") ?? "",
    featuredImage: formData.get("featuredImage") ?? undefined,
    status: formData.get("status"),
    seoTitle: formData.get("seoTitle") ?? undefined,
    seoDescription: formData.get("seoDescription") ?? undefined,
    publishedAt: formData.get("publishedAt") ?? undefined,
    categoryIds: formData.getAll("categoryIds"),
  });
}

function toValues(d: z.infer<typeof PostInput>) {
  const content = sanitizePostHtml(d.content);
  const publishedAt = d.publishedAt ? new Date(d.publishedAt) : d.status === "published" ? new Date() : null;
  return {
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt || null,
    content,
    featuredImage: d.featuredImage || null,
    status: d.status,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
    publishedAt,
    updatedAt: new Date(),
  };
}

async function setCategories(postId: number, ids: number[]) {
  await db.delete(postCategory).where(eq(postCategory.postId, postId));
  if (ids.length) await db.insert(postCategory).values(ids.map((categoryId) => ({ postId, categoryId })));
}

function friendly(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return /unique|duplicate/i.test(msg) ? "Another post already uses that slug." : "Could not save the post.";
}

export async function savePost(id: number | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let postId = id;
  try {
    const values = toValues(parsed.data);
    if (id) {
      await db.update(post).set(values).where(eq(post.id, id));
    } else {
      const [row] = await db.insert(post).values(values).returning({ id: post.id });
      postId = row.id;
    }
    await setCategories(postId!, parsed.data.categoryIds);
  } catch (e) {
    return { error: friendly(e) };
  }

  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/posts/${postId}?saved=1`);
  return { ok: true };
}

export async function deletePost(id: number) {
  await requireAdmin();
  await db.delete(post).where(eq(post.id, id));
  revalidatePath("/", "layout");
  redirect("/admin");
}
