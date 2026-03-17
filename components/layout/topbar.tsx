import { siteConfig } from "@/config/site";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "@/components/common/theme-toggle";
import Link from "next/link";

export function Topbar() {
  return (
    <header className="sticky top-0 z-50 lg:hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-14 px-4">
        <MobileNav />
        <Link href="/" className="font-bold text-base">
          {siteConfig.name}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
