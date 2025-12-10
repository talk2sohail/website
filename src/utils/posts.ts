import type { CollectionEntry } from "astro:content";

export function sortPosts(
  a: CollectionEntry<"blog">,
  b: CollectionEntry<"blog">,
): number {
  return b.data.publishDate.valueOf() - a.data.publishDate.valueOf();
}

export function sortTils(
  a: CollectionEntry<"til">,
  b: CollectionEntry<"til">,
): number {
  return b.data.publishDate.valueOf() - a.data.publishDate.valueOf();
}
