import type { Metadata } from "next";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const YM_ID = process.env.NEXT_PUBLIC_YM_ID || "";

export const metadata: Metadata = {
  title: "ТОПХИТ — Интернет-магазин товаров",
  description: "ТОПХИТ — динамично развивающаяся торговая компания. Широкий ассортимент товаров для повседневной жизни, бизнеса и семьи. Продукты питания, бытовая химия, электроника, товары для дома. Доставка по Москве и МО.",
  keywords: "интернет-магазин, ТОПХИТ, продукты, бытовая химия, электроника, оптовые продажи, доставка Москва",
  openGraph: {
    title: "ТОПХИТ — Интернет-магазин товаров",
    description: "Широкий ассортимент товаров по честным ценам с доставкой по Москве и МО",
    locale: "ru_RU",
    type: "website",
    siteName: "ТОПХИТ",
    url: "https://tophit.store",
  },
  alternates: {
    canonical: "https://tophit.store",
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
        <meta name="yandex-verification" content="" />
        <meta name="google-site-verification" content="" />
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}')` }} />
          </>
        )}
        {YM_ID && (
          <script dangerouslySetInnerHTML={{ __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${YM_ID},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true})` }} />
        )}
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
