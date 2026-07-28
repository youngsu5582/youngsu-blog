import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("legacy URL redirects", () => {
  it("returns permanent redirects for migrated routes", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const bySource = new Map(redirects.map((redirect) => [redirect.source, redirect]));

    expect(bySource.get("/en")).toMatchObject({
      destination: "/posts?lang=en",
      permanent: true,
    });
    expect(bySource.get("/popular")).toMatchObject({
      destination: "/posts",
      permanent: true,
    });
    expect(bySource.get("/posts/cloudfront")).toMatchObject({
      destination: "/notes/cloudfront",
      permanent: true,
    });
  });

  it("normalizes old taxonomy slugs to the current encoded paths", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const bySource = new Map(redirects.map((redirect) => [redirect.source, redirect]));

    expect(bySource.get("/tags/batch-insert")?.destination).toBe("/tags/Batch%20Insert");
    expect(bySource.get(`/tags/${encodeURIComponent("쉘-스크립트")}`)?.destination).toBe(
      "/tags/%EC%89%98%20%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8",
    );
  });
});
