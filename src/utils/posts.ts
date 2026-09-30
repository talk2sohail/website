import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

export type PostCollection = "blog" | "til";
export type Post = CollectionEntry<"blog"> | CollectionEntry<"til">;

export function sortPosts(a: Post, b: Post): number {
  return b.data.publishDate.valueOf() - a.data.publishDate.valueOf();
}

// Published posts of a collection, newest first. Drafts only show in dev.
export async function getPosts<C extends PostCollection>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  const posts = await getCollection(
    collection,
    (post: Post) => import.meta.env.DEV || !post.data.draft,
  );
  return (posts as CollectionEntry<C>[]).sort(sortPosts);
}

export async function getAllPosts(): Promise<Post[]> {
  const [blog, til] = await Promise.all([getPosts("blog"), getPosts("til")]);
  return [...blog, ...til].sort(sortPosts);
}

export function postUrl(post: Post): string {
  return `/${post.collection}/${post.id}/`;
}

export function tagUrl(tag: string): string {
  return `/tags/${slugifyTag(tag)}/`;
}

export function slugifyTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function formatDate(date: Date, style: "long" | "short" = "long"): string {
  return date.toLocaleDateString("en-US", {
    day: style === "long" ? "numeric" : "2-digit",
    month: style,
    year: "numeric",
    timeZone: "UTC",
  });
}
