import Link from "next/link";
import { LayoutDashboard, Image, Languages, GitPullRequest, Eye, PenLine, Settings, FolderOpen } from "lucide-react";

const adminNav = [
  { name: "대시보드", href: "/admin", icon: LayoutDashboard },
  { name: "썸네일", href: "/admin/thumbnail", icon: Image },
  { name: "번역", href: "/admin/translate", icon: Languages },
  { name: "발행", href: "/admin/publish", icon: GitPullRequest },
  { name: "미리보기", href: "/admin/preview", icon: Eye },
  { name: "작성", href: "/admin/write", icon: PenLine },
  { name: "일괄 수정", href: "/admin/bulk-edit", icon: Settings },
  { name: "옵시디언", href: "/admin/obsidian", icon: FolderOpen },
  { name: "설정", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Production에서는 빈 페이지 표시
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">관리 페이지는 개발 환경에서만 접근 가능합니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-xs text-muted-foreground mt-1">로컬 전용 관리 도구</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
