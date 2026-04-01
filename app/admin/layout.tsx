import { AdminNav } from "./components/admin-nav";

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
      <AdminNav />

      {children}
    </div>
  );
}
