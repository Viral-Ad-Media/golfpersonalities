import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { category, post, postCategory } from "@/db/schema";
import { deletePost, savePost } from "../../actions";
import { PostForm } from "../../PostForm";

export default async function EditPostPage({ params, searchParams }: PageProps<"/admin/posts/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [row] = await db.select().from(post).where(eq(post.id, id));
  if (!row) notFound();
  const [categories, links] = await Promise.all([
    db.select().from(category).orderBy(category.name),
    db.select().from(postCategory).where(eq(postCategory.postId, id)),
  ]);
  const saved = (await searchParams).saved === "1";

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Edit post</h1>
        <form action={deletePost.bind(null, id)}>
          <button className="text-sm text-red-700 hover:underline">Delete post</button>
        </form>
      </div>
      <PostForm
        post={row}
        categories={categories}
        selected={links.map((l) => l.categoryId)}
        action={savePost.bind(null, id)}
        saved={saved}
      />
    </>
  );
}
