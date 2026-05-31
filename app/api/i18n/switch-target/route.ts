import { NextRequest, NextResponse } from "next/server";
import { getLanguageSwitchTarget } from "@/lib/i18n-routing";
import type { Locale } from "@/lib/i18n";

function isLocale(value: string | null): value is Locale {
  return value === "ko" || value === "en";
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "/";
  const lang = request.nextUrl.searchParams.get("lang");

  if (!isLocale(lang)) {
    return NextResponse.json({ error: "Invalid lang" }, { status: 400 });
  }

  return NextResponse.json({ href: getLanguageSwitchTarget(path, lang) });
}
