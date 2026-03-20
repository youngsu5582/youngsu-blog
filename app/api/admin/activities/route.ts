import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ACTIVITIES_PATH = path.join(process.cwd(), "public/assets/data/activities.json");

interface Activity {
  title: { ko: string; en: string };
  date: string;
  images: string[];
  description: { ko: string; en: string };
  full_content: { ko: string; en: string };
  latitude: number;
  longitude: number;
}

// GET: 활동 목록 반환
export async function GET() {
  try {
    if (!fs.existsSync(ACTIVITIES_PATH)) {
      return NextResponse.json({ success: true, activities: [] });
    }

    const content = fs.readFileSync(ACTIVITIES_PATH, "utf-8");
    const activities = JSON.parse(content) as Activity[];

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error("Failed to read activities:", error);
    return NextResponse.json({ success: false, error: "활동 목록 로드 실패" }, { status: 500 });
  }
}

// POST: 새 활동 추가
export async function POST(req: NextRequest) {
  try {
    const { activity } = await req.json();

    if (!activity || !activity.title?.ko || !activity.title?.en) {
      return NextResponse.json({ success: false, error: "제목(ko/en)은 필수입니다" }, { status: 400 });
    }

    let activities: Activity[] = [];
    if (fs.existsSync(ACTIVITIES_PATH)) {
      const content = fs.readFileSync(ACTIVITIES_PATH, "utf-8");
      activities = JSON.parse(content);
    }

    activities.push(activity);

    const dir = path.dirname(ACTIVITIES_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(ACTIVITIES_PATH, JSON.stringify(activities, null, 2), "utf-8");

    return NextResponse.json({ success: true, message: "활동이 추가되었습니다" });
  } catch (error) {
    console.error("Failed to add activity:", error);
    return NextResponse.json({ success: false, error: "활동 추가 실패" }, { status: 500 });
  }
}

// PUT: 기존 활동 수정
export async function PUT(req: NextRequest) {
  try {
    const { index, activity } = await req.json();

    if (typeof index !== "number" || !activity) {
      return NextResponse.json({ success: false, error: "잘못된 요청입니다" }, { status: 400 });
    }

    if (!fs.existsSync(ACTIVITIES_PATH)) {
      return NextResponse.json({ success: false, error: "활동 파일이 없습니다" }, { status: 404 });
    }

    const content = fs.readFileSync(ACTIVITIES_PATH, "utf-8");
    const activities: Activity[] = JSON.parse(content);

    if (index < 0 || index >= activities.length) {
      return NextResponse.json({ success: false, error: "존재하지 않는 활동입니다" }, { status: 404 });
    }

    activities[index] = activity;

    fs.writeFileSync(ACTIVITIES_PATH, JSON.stringify(activities, null, 2), "utf-8");

    return NextResponse.json({ success: true, message: "활동이 수정되었습니다" });
  } catch (error) {
    console.error("Failed to update activity:", error);
    return NextResponse.json({ success: false, error: "활동 수정 실패" }, { status: 500 });
  }
}

// DELETE: 활동 삭제
export async function DELETE(req: NextRequest) {
  try {
    const { index } = await req.json();

    if (typeof index !== "number") {
      return NextResponse.json({ success: false, error: "잘못된 요청입니다" }, { status: 400 });
    }

    if (!fs.existsSync(ACTIVITIES_PATH)) {
      return NextResponse.json({ success: false, error: "활동 파일이 없습니다" }, { status: 404 });
    }

    const content = fs.readFileSync(ACTIVITIES_PATH, "utf-8");
    const activities: Activity[] = JSON.parse(content);

    if (index < 0 || index >= activities.length) {
      return NextResponse.json({ success: false, error: "존재하지 않는 활동입니다" }, { status: 404 });
    }

    activities.splice(index, 1);

    fs.writeFileSync(ACTIVITIES_PATH, JSON.stringify(activities, null, 2), "utf-8");

    return NextResponse.json({ success: true, message: "활동이 삭제되었습니다" });
  } catch (error) {
    console.error("Failed to delete activity:", error);
    return NextResponse.json({ success: false, error: "활동 삭제 실패" }, { status: 500 });
  }
}
