import { AdminNav } from "./components/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminEnabled = process.env.NODE_ENV !== "production" || process.env.ADMIN_UI_ENABLED === "true";

  // Public production blog builds keep Admin disabled unless the protected
  // admin runtime explicitly enables it (Cloudflare Access is the auth layer).
  if (!adminEnabled) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">관리 페이지가 비활성화되어 있습니다.</p>
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
