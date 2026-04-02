import { siteConfig } from "@/config/site";
import Link from "next/link";
import { Github, Rss } from "lucide-react";
import { FadeOnScroll } from "@/components/common/fade-on-scroll";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections: Array<{
    title: string;
    links: Array<{ name: string; href: string; external?: boolean }>;
  }> = [
    {
      title: "콘텐츠",
      links: [
        { name: "포스트", href: "/posts" },
        { name: "아티클", href: "/articles" },
        { name: "노트", href: "/notes" },
        { name: "서재", href: "/library" },
      ],
    },
    {
      title: "탐색",
      links: [
        { name: "카테고리", href: "/categories" },
        { name: "태그", href: "/tags" },
        { name: "아카이브", href: "/archives" },
      ],
    },
    {
      title: "소셜",
      links: [
        { name: "GitHub", href: siteConfig.author.github, external: true },
        { name: "RSS", href: "/feed.xml", external: true },
      ],
    },
  ];

  return (
    <footer className="theme-footer border-t border-border/40 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 lg:px-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-8">
          {/* Site Info */}
          <FadeOnScroll delay={0}>
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-semibold text-sm mb-3 text-foreground">
                {siteConfig.name}
              </h3>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                {siteConfig.description}
              </p>
            </div>
          </FadeOnScroll>

          {/* Footer Navigation Sections */}
          {footerSections.map((section, index) => (
            <FadeOnScroll key={section.title} delay={(index + 1) * 100}>
              <div>
              <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground/50 mb-3">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                      >
                        {link.name === "GitHub" && <Github className="h-3.5 w-3.5" />}
                        {link.name === "RSS" && <Rss className="h-3.5 w-3.5" />}
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              </div>
            </FadeOnScroll>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/40">
          <div className="flex flex-col items-center gap-2 text-center md:flex-row md:justify-between">
            <p className="text-xs text-muted-foreground/60 order-2 md:order-1">
              &copy; {currentYear} {siteConfig.author.name}. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/40 order-1 md:order-2">
              Built with Next.js
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
