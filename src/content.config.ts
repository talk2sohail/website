import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string(),
  publishDate: z.date(),
  updatedDate: z.date().optional(),
  tags: z.array(z.string()),
  // Drafts are visible in `astro dev` but left out of production builds.
  draft: z.boolean().default(false),
});

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: postSchema.extend({
    featured: z.boolean().default(false),
  }),
});

const tilCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/til" }),
  schema: postSchema,
});

export const collections = {
  blog: blogCollection,
  til: tilCollection,
};
