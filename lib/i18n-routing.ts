import { getAlternatePost, getPostBySlug, getUrlSlug, type Post } from "@/lib/content";
import type { Locale } from "@/lib/i18n";

function langListPath(lang: Locale) {
  return lang === "en" ? "/posts?lang=en" : "/posts";
}

function pathWithLang(pathname: string, lang: Locale) {
  return lang === "en" ? `${pathname}?lang=en` : pathname;
}

function parsePath(inputPath: string) {
  const url = new URL(inputPath, "https://youngsu5582.today");
  return url.pathname;
}

function isPostDetail(pathname: string) {
  return pathname.startsWith("/posts/") && pathname.split("/").filter(Boolean).length === 2;
}

function getPostForPath(pathname: string): Post | undefined {
  if (!isPostDetail(pathname)) return undefined;
  const slug = decodeURIComponent(pathname.replace(/^\/posts\//, ""));
  return getPostBySlug(slug);
}

export function getLanguageSwitchTarget(inputPath: string, targetLang: Locale) {
  const pathname = parsePath(inputPath);

  if (isPostDetail(pathname)) {
    const post = getPostForPath(pathname);
    const alternate = post ? getAlternatePost(post) : undefined;

    if (alternate && alternate.lang === targetLang) {
      return `/posts/${getUrlSlug(alternate.slug)}`;
    }

    if (post?.lang === targetLang) {
      return pathname;
    }

    return langListPath(targetLang);
  }

  if (pathname === "/posts" || pathname.startsWith("/categories") || pathname.startsWith("/tags")) {
    return pathWithLang(pathname, targetLang);
  }

  return targetLang === "en" ? "/posts?lang=en" : "/";
}
