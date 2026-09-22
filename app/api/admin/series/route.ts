import { NextResponse } from "next/server";
import { getAdminSeriesOptions } from "@/lib/admin-series";

export async function GET() {
  try {
    return NextResponse.json({ series: getAdminSeriesOptions() });
  } catch (error) {
    console.error("Failed to collect admin series:", error);
    return NextResponse.json({ error: "시리즈 목록을 불러오지 못했습니다" }, { status: 500 });
  }
}
