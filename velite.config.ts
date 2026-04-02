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
    related: s.array(s.string()).default([]),
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
    categories: s.array(s.string()).default([]),
    tags: s.array(s.string()).default([]),
    references: s.array(s.object({
      title: s.string(),
      url: s.string(),
    })).default([]),
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
          defaultLang: "plaintext",
          onVisitLine(node: any) {
            // Prevent lines from collapsing in `display: grid` mode, and allow empty
            // lines to be copy/pasted
            if (node.children.length === 0) {
              node.children = [{ type: "text", value: " " }];
            }
          },
          onVisitHighlightedLine(node: any) {
            node.properties.className?.push("line--highlighted");
          },
          onVisitHighlightedChars(node: any) {
            node.properties.className = ["word--highlighted"];
          },
          filterMetaString: (meta: string) => {
            // Parse meta string to extract title and other options
            // This ensures meta attributes are properly processed
            return meta;
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        { behavior: "wrap", properties: { className: ["anchor"] } },
      ],
    ],
  },
});
