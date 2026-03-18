"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { siteConfig } from "@/config/site";

export function GiscusComments() {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!ref.current) return;

    // Clear previous instance
    ref.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", siteConfig.giscus.repo);
    script.setAttribute("data-repo-id", siteConfig.giscus.repoId);
    script.setAttribute("data-category", siteConfig.giscus.category);
    script.setAttribute("data-category-id", siteConfig.giscus.categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", resolvedTheme === "dark" ? "dark" : "light");
    script.setAttribute("data-lang", "ko");
    script.setAttribute("data-loading", "lazy");
    script.crossOrigin = "anonymous";
    script.async = true;

    ref.current.appendChild(script);
  }, [resolvedTheme]);

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <div ref={ref} />
    </section>
  );
}
