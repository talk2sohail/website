import rss from "@astrojs/rss";
import { getAllPosts, postUrl } from "../utils/posts";

export async function GET(context) {
  const posts = await getAllPosts();
  return rss({
    title: "Md Sohail | Blog & TIL",
    description:
      "My personal blog and TIL posts where I write about technology, programming, and other interests.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishDate,
      description: post.data.description,
      categories: post.data.tags,
      link: postUrl(post),
    })),
  });
}
