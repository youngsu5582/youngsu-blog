import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST(req: Request) {
  try {
    const { message, files } = await req.json();
    const cwd = process.cwd();

    if (!message) {
      return NextResponse.json({ error: "커밋 메시지가 필요합니다" }, { status: 400 });
    }

    // Stage files
    if (files && files.length > 0) {
      for (const file of files) {
        execSync(`git add "${file}"`, { cwd });
      }
    } else {
      execSync("git add -A", { cwd });
    }

    // Commit
    const fs = require("fs");
    const tmpFile = "/tmp/admin-commit-msg.txt";
    fs.writeFileSync(tmpFile, message, "utf-8");
    const result = execSync(`git commit -F ${tmpFile}`, { cwd, encoding: "utf-8" });
    fs.unlinkSync(tmpFile);

    // Get commit hash
    const hash = execSync("git rev-parse --short HEAD", { cwd, encoding: "utf-8" }).trim();

    return NextResponse.json({ success: true, hash, output: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
