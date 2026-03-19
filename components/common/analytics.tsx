import Script from "next/script";
import { siteConfig } from "@/config/site";

export function Analytics() {
  const gaId = siteConfig.analytics.googleAnalyticsId;

  // production 환경에서만 활성화
  if (process.env.NODE_ENV !== "production" || !gaId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
