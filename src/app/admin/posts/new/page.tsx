import { db } from "@/db";
import { category } from "@/db/schema";
import { savePost } from "../../actions";
import { PostForm } from "../../PostForm";

export default async function NewPostPage() {
  const categories = await db.select().from(category).orderBy(category.name);
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">New post</h1>
      <PostForm categories={categories} selected={[]} action={savePost.bind(null, null)} />
    </>
  );
}
