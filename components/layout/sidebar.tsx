"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation, taxonomyNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Github, Mail, Rss } from "lucide-react";
import { SearchButton } from "@/components/search/search-button";
import { Avatar } from "@/components/common/avatar";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 theme-sidebar">
      <div className="flex flex-col h-full px-5 py-8">
        {/* Profile */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="theme-avatar-ring mb-4">
            <Avatar
              src="/assets/img/avatar.jpg"
              alt={siteConfig.author.name}
              size={80}
              fallbackText="영"
            />
          </div>
          <h2 className="font-semibold text-base text-sidebar-foreground tracking-tight">
            {siteConfig.author.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-[180px]">
            {siteConfig.description}
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <SearchButton />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 rounded-md",
                  isActive
                    ? "theme-nav-active font-medium"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.name}</span>
                {item.description && !isActive && (
                  <span className="ml-auto text-[10px] text-muted-foreground/60 hidden xl:inline">
                    {item.description}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="theme-divider my-4" />

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-3 mb-2">
            분류
          </p>
          {taxonomyNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 rounded-md",
                  isActive
                    ? "theme-nav-active font-medium"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6">
          <div className="theme-divider mb-4" />
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <a
                href={siteConfig.author.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/60 hover:text-primary transition-colors duration-200"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
              <a
                href={`mailto:${siteConfig.author.email}`}
                className="text-muted-foreground/60 hover:text-primary transition-colors duration-200"
              >
                <Mail className="h-3.5 w-3.5" />
              </a>
              <a
                href="/feed.xml"
                className="text-muted-foreground/60 hover:text-primary transition-colors duration-200"
              >
                <Rss className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="flex items-center gap-0.5">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
