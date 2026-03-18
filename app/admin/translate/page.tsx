"use client";

import { Languages } from "lucide-react";

export default function TranslatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">번역기</h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI 모델로 포스트를 번역하고 비교합니다
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg">
        <div className="p-3 rounded-full bg-primary/10 mb-4">
          <Languages className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-medium mb-1">API 키 설정이 필요합니다</p>
        <p className="text-xs text-muted-foreground max-w-sm text-center">
          .env.local에 GOOGLE_API_KEY 또는 OPENAI_API_KEY를 추가하세요.
        </p>
        <div className="flex gap-2 mt-4">
          {["Google Translate", "OpenAI", "Gemini"].map((model) => (
            <span key={model} className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {model} — 미설정
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
