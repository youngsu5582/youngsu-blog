"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { trackSearchResults, trackSearchResultSelect } from "@/lib/analytics";

export function SearchPageTracking({ query, resultCount, filter }: { query: string; resultCount: number; filter: string }) {
  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (!query) return;
    const key = `${query}:${filter}:${resultCount}`;
    if (tracked.current === key) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sendWhenReady = () => {
      if (!window.gtag) {
        if (process.env.NODE_ENV === "production") timer = setTimeout(sendWhenReady, 250);
        return;
      }
      tracked.current = key;
      trackSearchResults(resultCount, "all", "page", filter);
    };
    sendWhenReady();
    return () => clearTimeout(timer);
  }, [query, resultCount, filter]);
  return null;
}

export function SearchPageResultLink({ resultType, rank, ...props }: ComponentProps<typeof Link> & { resultType: string; rank: number }) {
  return <Link {...props} onClick={() => trackSearchResultSelect(resultType, rank, "all", "page")} />;
}
