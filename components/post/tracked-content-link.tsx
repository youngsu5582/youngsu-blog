"use client";

import Link from "next/link";
import { trackContentNavigation } from "@/lib/analytics";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  source: string;
  destination: string;
  location: "related" | "series" | "prev_next";
};

export function TrackedContentLink({ source, destination, location, onClick, ...props }: Props) {
  return <Link {...props} onClick={(event) => {
    // 클릭 의도를 기록한다. 목적지 페이지가 실제로 로드됐다는 의미는 아니다.
    trackContentNavigation(source, destination, location);
    // Link 사용처에서 전달한 기존 클릭 동작도 보존한다.
    onClick?.(event);
  }} />;
}
