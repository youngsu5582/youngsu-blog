import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="theme-footer py-8 px-4 mt-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs text-muted-foreground/60">
          Built with Next.js + Tailwind CSS
        </p>
        <p className="text-xs text-muted-foreground/40">
          &copy; {new Date().getFullYear()} {siteConfig.author.name}
        </p>
      </div>
    </footer>
  );
}
