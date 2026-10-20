"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackLangChange } from "@/lib/analytics";

export function TranslationLink({ from, to, contentId, ...props }: ComponentProps<typeof Link> & {
  from: "ko" | "en";
  to: "ko" | "en";
  contentId: string;
}) {
  return <Link {...props} onClick={() => trackLangChange(from, to, contentId, "translation")} />;
}
