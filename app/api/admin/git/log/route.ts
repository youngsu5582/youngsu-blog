import { NextResponse } from "next/server";
import { execSync } from "child_process";

interface GitLogEntry {
  hash: string;
  message: string;
  timestamp: string;
  relativeTime: string;
  files: string[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "10";
    const path = searchParams.get("path") || "content/";

    const cwd = process.cwd();

    // Get commit log with format: hash|message|timestamp
    const logCommand = `git log -${limit} --pretty=format:"%H|%s|%ct" -- ${path}`;
    const logOutput = execSync(logCommand, { cwd, encoding: "utf-8" });

    if (!logOutput.trim()) {
      return NextResponse.json({ success: true, commits: [] });
    }

    const commits: GitLogEntry[] = [];

    for (const line of logOutput.split("\n").filter(Boolean)) {
      const [hash, message, timestampStr] = line.split("|");
      const timestamp = parseInt(timestampStr, 10);
      const now = Math.floor(Date.now() / 1000);
      const diff = now - timestamp;

      // Calculate relative time
      let relativeTime: string;
      if (diff < 60) {
        relativeTime = "방금 전";
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        relativeTime = `${minutes}분 전`;
      } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        relativeTime = `${hours}시간 전`;
      } else if (diff < 604800) {
        const days = Math.floor(diff / 86400);
        relativeTime = `${days}일 전`;
      } else if (diff < 2592000) {
        const weeks = Math.floor(diff / 604800);
        relativeTime = `${weeks}주 전`;
      } else {
        const months = Math.floor(diff / 2592000);
        relativeTime = `${months}개월 전`;
      }

      // Get files changed in this commit
      const filesCommand = `git show --name-only --pretty=format:"" ${hash} -- ${path}`;
      const filesOutput = execSync(filesCommand, { cwd, encoding: "utf-8" });
      const files = filesOutput
        .split("\n")
        .filter(Boolean)
        .filter((f) => f.startsWith(path.replace(/\/$/, "")));

      commits.push({
        hash,
        message,
        timestamp: new Date(timestamp * 1000).toISOString(),
        relativeTime,
        files,
      });
    }

    return NextResponse.json({ success: true, commits });
  } catch (error) {
    console.error("Failed to get git log:", error);
    return NextResponse.json({ success: false, error: "git log 조회 실패", commits: [] }, { status: 500 });
  }
}
