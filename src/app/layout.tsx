import type { Metadata } from "next";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

export const metadata: Metadata = {
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
  },
  title: "ТОПХИТ — Интернет-магазин товаров",
  description: "ТОПХИТ — интернет-магазин товаров оптом и в розницу по выгодным ценам. Продукты питания, бытовая химия, электроника, товары для дома. Быстрая доставка по Москве и МО.",
  keywords: "интернет-магазин, ТОПХИТ, продукты, бытовая химия, электроника, оптовые продажи, доставка Москва",
  openGraph: {
    title: "ТОПХИТ — Интернет-магазин товаров",
    description: "Широкий ассортимент товаров по честным ценам с доставкой по Москве и МО",
    locale: "ru_RU",
    type: "website",
    siteName: "ТОПХИТ",
    url: "https://tophitt.ru",
  },
  alternates: {
    canonical: "https://tophitt.ru",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" fetchPriority="high" />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-GTTS4HE5R3" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-GTTS4HE5R3')` }} />
        {/* Yandex.Metrika */}
        <script dangerouslySetInnerHTML={{ __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=109025489','ym');ym(109025489,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",accurateTrackBounce:true,trackLinks:true})` }} />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <noscript>
          <div><img src="https://mc.yandex.ru/watch/109025489" style={{ position: "absolute", left: "-9999px" }} alt="" /></div>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ТОПХИТ",
              url: "https://tophitt.ru",
              logo: "https://tophitt.ru/logo.png",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+7-936-256-89-50",
                contactType: "customer service",
                areaServed: "RU",
                availableLanguage: "Russian",
              },
              sameAs: [
                "https://t.me/tophit_store",
                "https://vk.com/tophit_market",
                "https://www.ozon.ru/seller/tophit/",
                "https://wa.me/79362568950",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "ТОПХИТ",
              image: "https://tophitt.ru/logo.png",
              url: "https://tophitt.ru",
              telephone: "+7-936-256-89-50",
              email: "zakaz@tophitt.ru",
              address: {
                "@type": "PostalAddress",
                streetAddress: "ул. Складочная, д. 1, стр. 18",
                addressLocality: "Москва",
                postalCode: "127018",
                addressCountry: "RU",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 55.8025,
                longitude: 37.5937,
              },
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                opens: "09:00",
                closes: "18:00",
              },
              priceRange: "₽₽",
            }),
          }}
        />
        {children}
        <ClientShell />
      </body>
    </html>
  );
}
