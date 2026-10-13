export const referenceTypes = ["video", "article", "docs"] as const;
export type ReferenceType = (typeof referenceTypes)[number];

export const referenceRoles = ["primary", "supporting", "verification"] as const;
export type ReferenceRole = (typeof referenceRoles)[number];

export interface ReferenceInput {
  title: string;
  url: string;
  type?: ReferenceType;
  role?: ReferenceRole;
  description?: string;
}

export interface ResolvedReference extends ReferenceInput {
  type: ReferenceType;
  hostname: string;
}

export interface ReferenceLayout {
  primary?: ResolvedReference;
  secondary: ResolvedReference[];
}

function parseHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function normalizedHostname(url: URL) {
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

function isYouTubeHostname(hostname: string) {
  return hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be";
}

function isDocumentationHostname(hostname: string) {
  return (
    hostname.startsWith("docs.") ||
    hostname.includes(".docs.") ||
    hostname.startsWith("developer.") ||
    hostname.startsWith("developers.") ||
    hostname === "developer.mozilla.org"
  );
}

export function getReferenceType(reference: ReferenceInput): ReferenceType {
  if (reference.type && referenceTypes.includes(reference.type)) return reference.type;

  const url = parseHttpUrl(reference.url);
  if (!url) return "article";

  const hostname = normalizedHostname(url);
  if (isYouTubeHostname(hostname)) return "video";
  if (isDocumentationHostname(hostname)) return "docs";
  return "article";
}

export function getYouTubeVideoId(value: string) {
  const url = parseHttpUrl(value);
  if (!url || !isYouTubeHostname(normalizedHostname(url))) return null;

  const hostname = normalizedHostname(url);
  let candidate = "";

  if (hostname === "youtu.be") {
    candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } else if (url.pathname === "/watch") {
    candidate = url.searchParams.get("v") ?? "";
  } else if (url.pathname.startsWith("/live/") || url.pathname.startsWith("/shorts/")) {
    candidate = url.pathname.split("/").filter(Boolean)[1] ?? "";
  }

  return /^[A-Za-z0-9_-]{6,}$/.test(candidate) ? candidate : null;
}

export function getYouTubeEmbedUrl(value: string) {
  const videoId = getYouTubeVideoId(value);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : null;
}

function resolveReference(reference: ReferenceInput): ResolvedReference | null {
  const url = parseHttpUrl(reference.url);
  if (!url || !reference.title.trim()) return null;

  return {
    ...reference,
    title: reference.title.trim(),
    url: url.toString(),
    type: getReferenceType(reference),
    hostname: normalizedHostname(url),
  };
}

export function getReferenceLayout(references: ReferenceInput[]): ReferenceLayout {
  const resolved = references
    .map(resolveReference)
    .filter((reference): reference is ResolvedReference => Boolean(reference));
  const primary =
    resolved.find((reference) => reference.type === "video" && reference.role === "primary") ??
    resolved.find((reference) => reference.type === "video");

  return {
    primary,
    secondary: primary ? resolved.filter((reference) => reference !== primary) : resolved,
  };
}
