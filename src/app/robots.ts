import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://tophitt.ru";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/checkout"],
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/admin", "/api/", "/checkout"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
