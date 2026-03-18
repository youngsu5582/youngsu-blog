import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
  try {
    const cwd = process.cwd();
    const raw = execSync("git status --porcelain", { cwd, encoding: "utf-8" });

    const modified: string[] = [];
    const added: string[] = [];
    const deleted: string[] = [];
    const untracked: string[] = [];

    for (const line of raw.split("\n").filter(Boolean)) {
      const status = line.substring(0, 2).trim();
      const file = line.substring(3);

      if (status === "M" || status === "MM") modified.push(file);
      else if (status === "A") added.push(file);
      else if (status === "D") deleted.push(file);
      else if (status === "??") untracked.push(file);
      else modified.push(file);
    }

    return NextResponse.json({ modified, added, deleted, untracked });
  } catch {
    return NextResponse.json({ modified: [], added: [], deleted: [], untracked: [] });
  }
}
