export type ContentSortOrder = "newest" | "oldest";

export interface AdminContentListItem {
  slug: string;
  title: string;
  collection: string;
  date: string;
}

export function parseAdminContentDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function formatAdminContentDate(value: string) {
  const timestamp = parseAdminContentDate(value);
  return timestamp === 0 ? "날짜 없음" : new Date(timestamp).toLocaleDateString("ko-KR");
}

export function sortAdminContentItems<T extends AdminContentListItem>(
  items: T[],
  order: ContentSortOrder = "newest",
) {
  return [...items].sort((a, b) => {
    const dateDiff = parseAdminContentDate(b.date) - parseAdminContentDate(a.date);
    const direction = order === "newest" ? dateDiff : -dateDiff;
    return direction || a.title.localeCompare(b.title, "ko") || a.slug.localeCompare(b.slug);
  });
}
