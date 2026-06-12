import { siteConfig } from "@/config/site";
import { absoluteSiteUrl } from "@/lib/seo";

export interface ArticleSchemaProps {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  image?: string;
  url: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generate JSON-LD schema for Article (blog post)
 * @see https://developers.google.com/search/docs/appearance/structured-data/article
 */
export function generateArticleSchema(props: ArticleSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: props.title,
    description: props.description,
    datePublished: props.datePublished,
    dateModified: props.dateModified || props.datePublished,
    author: {
      "@type": "Person",
      name: props.author,
      url: siteConfig.author.github,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.url,
    },
    image: absoluteSiteUrl(props.image),
    url: props.url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": props.url,
    },
  };
}

/**
 * Generate JSON-LD schema for WebSite
 * @see https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    publisher: generatePersonSchema(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generatePersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author.name,
    url: siteConfig.url,
    email: siteConfig.author.email,
    image: absoluteSiteUrl(siteConfig.author.avatar),
    sameAs: [siteConfig.author.github, siteConfig.author.linkedin].filter(Boolean),
    jobTitle: "Backend Developer",
    knowsAbout: ["Backend Development", "Java", "Spring", "Database", "Homelab"],
  };
}

/**
 * Generate JSON-LD schema for BreadcrumbList
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Render JSON-LD script tag
 */
export function renderJsonLd(data: object) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
