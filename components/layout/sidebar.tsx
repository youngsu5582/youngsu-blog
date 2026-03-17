"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation, taxonomyNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, Rss } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-sidebar">
      <div className="flex flex-col h-full px-4 py-6">
        {/* Profile */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-muted mb-3 overflow-hidden">
            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              영
            </div>
          </div>
          <h2 className="font-bold text-lg text-sidebar-foreground">{siteConfig.author.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{siteConfig.description}</p>
        </div>

        <Separator className="mb-4" />

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}

          <Separator className="my-3" />

          {taxonomyNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <Separator className="mb-4" />
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <a
                href={siteConfig.author.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${siteConfig.author.email}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="/feed.xml"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Rss className="h-4 w-4" />
              </a>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
