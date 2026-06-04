import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminTaxonomiesPage from "@/app/admin/taxonomies/page";

const taxonomyResponse = {
  field: "tags",
  items: [
    {
      value: "home-lab",
      count: 2,
      files: [
        { repoPath: "content/posts/a.mdx", title: "홈랩 글" },
        { repoPath: "content/notes/b.mdx", title: "홈랩 메모" },
      ],
    },
    {
      value: "homelab",
      count: 1,
      files: [{ repoPath: "content/posts/c.mdx", title: "홈서버 글" }],
    },
  ],
};

describe("Admin taxonomies page", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.startsWith("/api/admin/taxonomies") && init?.method !== "POST") {
          return Promise.resolve(new Response(JSON.stringify(taxonomyResponse), { status: 200 }));
        }

        if (url === "/api/admin/taxonomies" && init?.method === "POST") {
          return Promise.resolve(new Response(JSON.stringify({ success: true, updatedFiles: ["content/posts/a.mdx", "content/notes/b.mdx"] }), { status: 200 }));
        }

        return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rename 적용 전에 영향 받을 파일 목록을 보여준다", async () => {
    render(<AdminTaxonomiesPage />);

    fireEvent.click(await screen.findByRole("button", { name: /home-lab/ }));

    expect(screen.getByRole("region", { name: "변경 영향 미리보기" })).toBeTruthy();
    expect(screen.getByText("적용 전 영향 파일 2개")).toBeTruthy();
    expect(screen.getByText("홈랩 글")).toBeTruthy();
    expect(screen.getByText("content/posts/a.mdx")).toBeTruthy();
    expect(screen.getByRole("button", { name: "2개 파일에 적용" })).toBeTruthy();
  });
});
