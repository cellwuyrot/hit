import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tophitt.ru"),
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
  },
  title: "ТОПХИТ — Товары оптом и в розницу по ценам от производителя",
  description: "Интернет-магазин ТОПХИТ — продукты, бытовая химия, товары для дома оптом и в розницу. Скидка 10% при покупке упаковкой. Доставка по Москве и МО, самовывоз со склада.",
  keywords: "интернет-магазин, ТОПХИТ, товары оптом, розница, продукты, бытовая химия, доставка Москва, скидки",
  openGraph: {
    title: "ТОПХИТ — Товары оптом и в розницу по ценам от производителя",
    description: "Продукты, бытовая химия, товары для дома — от 1 штуки или упаковками со скидкой 10%. Доставка по Москве и МО.",
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
    <html lang="ru" className={`h-full antialiased ${inter.variable} ${manrope.variable}`}>
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-GTTS4HE5R3" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-GTTS4HE5R3')` }} />
        {/* Yandex.Metrika */}
        <script dangerouslySetInnerHTML={{ __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=109327312','ym');ym(109327312,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",accurateTrackBounce:true,trackLinks:true})` }} />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <noscript>
          <div><img src="https://mc.yandex.ru/watch/109327312" style={{ position: "absolute", left: "-9999px" }} alt="" /></div>
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
