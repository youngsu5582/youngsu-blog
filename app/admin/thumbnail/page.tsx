"use client";

import { useState } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";

export default function ThumbnailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">썸네일 생성기</h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI 모델로 포스트 썸네일을 생성하고 비교합니다
        </p>
      </div>

      {/* Placeholder - API 연동 후 구현 */}
      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg">
        <div className="p-3 rounded-full bg-primary/10 mb-4">
          <ImageIcon className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-medium mb-1">API 키 설정이 필요합니다</p>
        <p className="text-xs text-muted-foreground max-w-sm text-center">
          .env.local에 GEMINI_API_KEY 또는 OPENAI_API_KEY를 추가하세요.
          설정된 모델만 활성화됩니다.
        </p>
        <div className="flex gap-2 mt-4">
          {["Gemini", "DALL-E", "GPT Image"].map((model) => (
            <span key={model} className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {model} — 미설정
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
