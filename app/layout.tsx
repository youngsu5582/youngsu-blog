import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { ThemeProvider } from "@/components/common/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Footer } from "@/components/layout/footer";
import { Analytics } from "@/components/common/analytics";
import { generateWebSiteSchema, renderJsonLd } from "@/lib/json-ld";
import { buildRootLanguageAlternates } from "@/lib/seo";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: `${siteConfig.name} - Korean` },
        { url: "/feed-en.xml", title: `${siteConfig.name} - English` },
      ],
    },
    languages: buildRootLanguageAlternates(),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = generateWebSiteSchema();

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {renderJsonLd(websiteSchema)}
      </head>
      <body className={`${jetbrainsMono.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
        >
          본문으로 건너뛰기
        </a>
        <ThemeProvider>
          <div className="relative min-h-screen">
            <Sidebar />
            <div className="lg:pl-64">
              <Topbar />
              <main id="main-content" className="max-w-6xl mx-auto px-6 py-10 lg:px-10">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
