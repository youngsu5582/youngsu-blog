"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

interface CodeCopyButtonProps {
  code: string;
}

export function CodeCopyButton({ code }: CodeCopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={copyToClipboard}
      className="absolute top-3 right-3 p-2 rounded-md transition-all duration-200 bg-background/50 hover:bg-background/80 backdrop-blur-sm border border-border/50 hover:border-border opacity-0 group-hover:opacity-100"
      aria-label={copied ? "코드 복사됨" : "코드 복사"}
      title={copied ? "복사 완료!" : "클립보드에 복사"}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
}
