import { siteConfig } from "@/config/site";

export type SupportedLanguage = "ko" | "en";

export function absoluteSiteUrl(pathOrUrl?: string) {
  if (!pathOrUrl) return `${siteConfig.url}/assets/img/avatar.jpg`;

  try {
    return new URL(pathOrUrl).toString();
  } catch {
    return new URL(pathOrUrl, siteConfig.url).toString();
  }
}

export function contentUrl(collection: "posts" | "articles" | "notes" | "library", slug: string) {
  return absoluteSiteUrl(`/${collection}/${slug}`);
}

export function buildRootLanguageAlternates() {
  // The site does not have a real /en root route; English content is exposed via
  // post-level `*-en` slugs and list-page `?lang=en` filters.
  return {
    ko: "/",
  };
}

export function buildTranslatedPostAlternates({
  currentLang,
  currentSlug,
  alternateLang,
  alternateSlug,
}: {
  currentLang: SupportedLanguage;
  currentSlug: string;
  alternateLang: SupportedLanguage;
  alternateSlug: string;
}) {
  const currentUrl = contentUrl("posts", currentSlug);
  const alternateUrl = contentUrl("posts", alternateSlug);
  const koUrl = currentLang === "ko" ? currentUrl : alternateUrl;

  return {
    [currentLang]: currentUrl,
    [alternateLang]: alternateUrl,
    "x-default": koUrl,
  };
}
