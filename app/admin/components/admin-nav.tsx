"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Image, Languages, GitPullRequest, Eye, PenLine, Settings, FolderOpen, FileEdit, MapPin, Layers, ChevronDown, PenSquare, Upload, Wrench, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavGroups = [
  {
    label: "콘텐츠",
    icon: PenSquare,
    items: [
      { name: "작성", href: "/admin/write", icon: PenLine },
      { name: "편집", href: "/admin/edit", icon: FileEdit },
      { name: "일괄 수정", href: "/admin/bulk-edit", icon: Layers },
    ],
  },
  {
    label: "발행",
    icon: Upload,
    items: [
      { name: "발행", href: "/admin/publish", icon: GitPullRequest },
      { name: "번역", href: "/admin/translate", icon: Languages },
      { name: "썸네일", href: "/admin/thumbnail", icon: Image },
      { name: "미리보기", href: "/admin/preview", icon: Eye },
    ],
  },
  {
    label: "관리",
    icon: Wrench,
    items: [
      { name: "대시보드", href: "/admin", icon: LayoutDashboard },
      { name: "활동관리", href: "/admin/activities", icon: MapPin },
      { name: "태그관리", href: "/admin/taxonomies", icon: Tags },
      { name: "옵시디언", href: "/admin/obsidian", icon: FolderOpen },
      { name: "설정", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  // Find current page info
  const currentPage = adminNavGroups
    .flatMap((group) => group.items)
    .find((item) => item.href === pathname);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {currentPage ? `${currentPage.name} · 로컬 전용 관리 도구` : "로컬 전용 관리 도구"}
        </p>
      </div>
      <nav className="flex items-center gap-1">
        {adminNavGroups.map((group) => {
          const GroupIcon = group.icon;
          const hasActivePage = group.items.some((item) => item.href === pathname);

          return (
            <div key={group.label} className="relative group">
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                  hasActivePage
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <GroupIcon className="h-3.5 w-3.5" />
                {group.label}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
              <div className="absolute top-full left-0 mt-1 min-w-[140px] rounded-md border border-border bg-popover shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
                <div className="py-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === pathname;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-xs transition-colors relative",
                          isActive
                            ? "text-foreground bg-accent font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {item.name}
                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
