import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-border py-6 px-4">
      <div className="text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {siteConfig.author.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
