import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json();
    const cwd = process.cwd();

    if (!title) {
      return NextResponse.json({ error: "PR 제목이 필요합니다" }, { status: 400 });
    }

    // Push current branch
    const branch = execSync("git branch --show-current", { cwd, encoding: "utf-8" }).trim();
    execSync(`git push -u origin ${branch}`, { cwd, encoding: "utf-8" });

    // Create PR
    const prBody = body || "";
    const fs = require("fs");
    const tmpFile = "/tmp/admin-pr-body.txt";
    fs.writeFileSync(tmpFile, prBody, "utf-8");

    const result = execSync(
      `gh pr create --title "${title.replace(/"/g, '\\"')}" --body-file ${tmpFile}`,
      { cwd, encoding: "utf-8" }
    );
    fs.unlinkSync(tmpFile);

    return NextResponse.json({ success: true, url: result.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
