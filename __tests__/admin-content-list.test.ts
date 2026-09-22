import { describe, expect, it } from "vitest";
import {
  formatAdminContentDate,
  sortAdminContentItems,
  type AdminContentListItem,
} from "@/lib/admin-content-list";

const items: AdminContentListItem[] = [
  { slug: "older-post", title: "Older", collection: "posts", date: "2026-01-02" },
  { slug: "newest-note", title: "Newest", collection: "notes", date: "2026-09-15" },
  { slug: "same-date-a", title: "가나다", collection: "posts", date: "2026-03-01" },
  { slug: "same-date-b", title: "다라마", collection: "articles", date: "2026-03-01" },
  { slug: "missing-date", title: "Missing", collection: "notes", date: "" },
];

describe("admin content list sorting", () => {
  it("sorts all collections by newest date by default", () => {
    expect(sortAdminContentItems(items).map((item) => item.slug)).toEqual([
      "newest-note",
      "same-date-a",
      "same-date-b",
      "older-post",
      "missing-date",
    ]);
  });

  it("supports oldest-first sorting", () => {
    expect(sortAdminContentItems(items, "oldest").map((item) => item.slug)).toEqual([
      "missing-date",
      "older-post",
      "same-date-a",
      "same-date-b",
      "newest-note",
    ]);
  });

  it("formats valid and missing dates for the edit list", () => {
    expect(formatAdminContentDate("2026-09-15")).toBe("2026. 9. 15.");
    expect(formatAdminContentDate("")).toBe("날짜 없음");
  });
});
