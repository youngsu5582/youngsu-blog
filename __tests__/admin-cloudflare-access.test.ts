import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf-8");
const exists = (file: string) => fs.existsSync(path.join(root, file));

describe("admin access boundary", () => {
  it("delegates Admin protection to Cloudflare Access instead of app-level login", () => {
    expect(exists("middleware.ts")).toBe(false);
    expect(exists("app/admin/login/page.tsx")).toBe(false);
    expect(exists("app/api/admin/login/route.ts")).toBe(false);
    expect(exists("app/api/admin/logout/route.ts")).toBe(false);
    expect(exists("lib/admin-auth.ts")).toBe(false);
    expect(exists("lib/admin-password.ts")).toBe(false);
    expect(exists("scripts/generate-admin-password.mjs")).toBe(false);
  });

  it("does not render logout controls that target removed app auth APIs", () => {
    const nav = read("app/admin/components/admin-nav.tsx");

    expect(nav).not.toContain("/api/admin/logout");
    expect(nav).not.toContain("/admin/login");
    expect(nav).not.toContain("LogOut");
    expect(nav).not.toContain("로그아웃");
  });

  it("allows a protected production admin runtime to opt in explicitly", () => {
    const layout = read("app/admin/layout.tsx");
    const sidebar = read("components/layout/sidebar.tsx");

    expect(layout).toContain('process.env.ADMIN_UI_ENABLED === "true"');
    expect(sidebar).toContain('process.env.NEXT_PUBLIC_ADMIN_UI_ENABLED === "true"');
  });
});
