import Script from "next/script";

/**
 * Google Analytics 4. Renders nothing unless NEXT_PUBLIC_GA_ID (like G-XXXXXXXXXX) is set, and never in development,
 * so local testing doesn't pollute your numbers. The ID is checked against the GA4 format before it goes into a script.
 */
export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID?.trim();
  if (process.env.NODE_ENV !== "production" || !id || !/^G-[A-Z0-9]{4,20}$/.test(id)) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');`}</Script>
  </>;
}
