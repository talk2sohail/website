
import type { CollectionEntry } from 'astro:content';

export function sortPosts(a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>): number {
  return b.data.publishDate.valueOf() - a.data.publishDate.valueOf();
}
