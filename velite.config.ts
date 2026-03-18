import { defineConfig, defineCollection, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkBreaks from "remark-breaks";

const posts = defineCollection({
  name: "Post",
  pattern: "posts/**/*.mdx",
  schema: s.object({
    title: s.string(),
    date: s.isodate(),
    description: s.string().optional().default(""),
    categories: s.array(s.string()).default([]),
    tags: s.array(s.string()).default([]),
    image: s.string().optional(),
    author: s.string().default("이영수"),
    toc: s.boolean().default(true),
    comments: s.boolean().default(true),
    draft: s.boolean().default(false),
    lang: s.enum(["ko", "en"]).default("ko"),
    series: s.string().optional(),
    slug: s.path(),
    body: s.mdx(),
    metadata: s.metadata(),
  }),
});

const articles = defineCollection({
  name: "Article",
  pattern: "articles/**/*.mdx",
  schema: s.object({
    title: s.string(),
    date: s.isodate(),
    description: s.string().optional().default(""),
    categories: s.array(s.string()).default([]),
    tags: s.array(s.string()).default([]),
    image: s.string().optional(),
    author: s.string().default("이영수"),
    moc: s.string().optional(),
    status: s.enum(["evergreen", "seed", "draft"]).default("seed"),
    subTopic: s.string().optional(),
    slug: s.path(),
    body: s.mdx(),
    metadata: s.metadata(),
  }),
});

const library = defineCollection({
  name: "LibraryItem",
  pattern: "library/**/*.mdx",
  schema: s.object({
    title: s.string(),
    date: s.isodate(),
    description: s.string().optional().default(""),
    categories: s.array(s.string()).default([]),
    tags: s.array(s.string()).default([]),
    image: s.string().optional(),
    author: s.string().default("이영수"),
    mediaType: s.enum(["book", "movie", "life"]).default("book"),
    rating: s.number().optional(),
    slug: s.path(),
    body: s.mdx(),
    metadata: s.metadata(),
  }),
});

const notes = defineCollection({
  name: "Note",
  pattern: "notes/**/*.{mdx,md}",
  schema: s.object({
    title: s.string().optional().default(""),
    date: s.isodate(),
    tags: s.array(s.string()).default([]),
    slug: s.path(),
    body: s.mdx(),
    metadata: s.metadata(),
  }),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts, articles, library, notes },
  mdx: {
    remarkPlugins: [remarkBreaks],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: { dark: "github-dark", light: "github-light" },
          keepBackground: false,
        },
      ],
      [
        rehypeAutolinkHeadings,
        { behavior: "wrap", properties: { className: ["anchor"] } },
      ],
    ],
  },
});
