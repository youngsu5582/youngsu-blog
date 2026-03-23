import { NextResponse } from "next/server";
import { getAvailableProviders } from "@/lib/ai-provider";

export async function GET() {
  const providers = getAvailableProviders();
  return NextResponse.json({
    providers,
  });
}
