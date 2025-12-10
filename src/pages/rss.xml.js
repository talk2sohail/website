import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const blog = await getCollection("blog");
  const til = await getCollection("til");
  const items = [
    ...blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
    ...til.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishDate,
      description: post.data.description,
      link: `/til/${post.slug}/`,
    })),
  ].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return rss({
    title: "Md Sohail | Blog & TIL",
    description:
      "My personal blog and TIL posts where I write about technology, programming, and other interests.",
    site: context.site,
    items,
  });
}
