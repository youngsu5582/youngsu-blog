import fs from "fs";
import { describe, expect, it } from "vitest";

describe("admin translate save route safety", () => {
  const source = fs.readFileSync("app/api/admin/translate/save/route.ts", "utf-8");

  it("기존 영어 번역본은 명시적 overwrite 없이는 저장하지 않는다", () => {
    expect(source).toContain("overwrite");
    expect(source).toContain("이미 영어 번역본이 있습니다");
    expect(source).toContain("status: 409");
    expect(source).toContain("!overwrite");
  });
});
