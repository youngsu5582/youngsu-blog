import { describe, expect, it } from "vitest";

import {
  buildUploadPublicUrl,
  getUploadStorageConfig,
  resolveUploadObjectKey,
} from "@/lib/admin-upload-storage";

describe("admin upload storage config", () => {
  it("defaults to local public assets when S3 upload is not configured", () => {
    const config = getUploadStorageConfig({});

    expect(config).toMatchObject({
      kind: "local",
      publicPrefix: "/assets/img/uploads",
    });
  });

  it("builds an S3/R2 config with a Cloudflare public base URL", () => {
    const config = getUploadStorageConfig({
      ADMIN_UPLOAD_STORAGE: "s3",
      S3_BUCKET: "iyeongsu-obsidian-images",
      S3_REGION: "ap-northeast-2",
      S3_ACCESS_KEY_ID: "access-key",
      S3_SECRET_ACCESS_KEY: "secret-key",
      S3_PUBLIC_BASE_URL: "https://img.youngsu5582.today/",
      S3_UPLOAD_PREFIX: "blog/${year}/${month}",
    });

    expect(config).toMatchObject({
      kind: "s3",
      bucket: "iyeongsu-obsidian-images",
      region: "ap-northeast-2",
      publicBaseUrl: "https://img.youngsu5582.today",
      uploadPrefix: "blog/${year}/${month}",
    });
  });

  it("accepts R2-native environment names and derives the S3-compatible endpoint", () => {
    const config = getUploadStorageConfig({
      ADMIN_UPLOAD_STORAGE: "r2",
      R2_ACCOUNT_ID: "account123",
      R2_BUCKET: "blog-images",
      R2_ACCESS_KEY_ID: "r2-access",
      R2_SECRET_ACCESS_KEY: "r2-secret",
      R2_PUBLIC_BASE_URL: "https://img.example.com/",
      R2_UPLOAD_PREFIX: "posts/${year}/${month}",
    });

    expect(config).toMatchObject({
      kind: "s3",
      bucket: "blog-images",
      region: "auto",
      endpoint: "https://account123.r2.cloudflarestorage.com",
      publicBaseUrl: "https://img.example.com",
      uploadPrefix: "posts/${year}/${month}",
      forcePathStyle: false,
    });
  });

  it("requires S3 credentials and public base URL when S3 upload is enabled", () => {
    expect(() => getUploadStorageConfig({ ADMIN_UPLOAD_STORAGE: "s3" })).toThrow(/S3_BUCKET/);
    expect(() =>
      getUploadStorageConfig({
        ADMIN_UPLOAD_STORAGE: "s3",
        S3_BUCKET: "bucket",
        S3_REGION: "ap-northeast-2",
        S3_ACCESS_KEY_ID: "access-key",
        S3_SECRET_ACCESS_KEY: "secret-key",
      }),
    ).toThrow(/S3_PUBLIC_BASE_URL/);
  });

  it("expands upload prefix variables and returns the Cloudflare URL", () => {
    const now = new Date("2026-06-14T12:34:56Z");

    expect(resolveUploadObjectKey("blog/${year}/${month}/${day}", "123-image.png", now)).toBe(
      "blog/2026/06/14/123-image.png",
    );
    expect(resolveUploadObjectKey("blog/${basename}", "123-image.png", now)).toBe(
      "blog/123-image/123-image.png",
    );
    expect(
      buildUploadPublicUrl("https://img.youngsu5582.today", "blog/2026/06/123-image.png"),
    ).toBe("https://img.youngsu5582.today/blog/2026/06/123-image.png");
  });
});
