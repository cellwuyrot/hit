import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://tophitt.ru";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/checkout", "/account", "/cart", "/compare", "/wishlist", "/wholesale?*"],
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/admin", "/api/", "/checkout", "/account", "/cart", "/compare", "/wishlist", "/wholesale?*"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
