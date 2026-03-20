"use client";

import { Twitter, Linkedin, Link2, Check, Github } from "lucide-react";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { trackShare } from "@/lib/analytics";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = `${siteConfig.url}/posts/${slug}`;
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    trackShare("copy_link", slug);
    setTimeout(() => setCopied(false), 2000);
  };

  const githubEditUrl = `https://github.com/youngsu5582/youngsu-blog/edit/main/content/posts/${slug}.mdx`;

  return (
    <div className="flex flex-col gap-3 pt-6 border-t border-border">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">공유</span>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="X (Twitter)"
        >
          <Twitter className="h-4 w-4" />
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </a>
        <button
          onClick={copyLink}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="링크 복사"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
        </button>
      </div>
      <a
        href={githubEditUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <Github className="h-3.5 w-3.5" />
        <span>GitHub에서 수정</span>
      </a>
    </div>
  );
}
