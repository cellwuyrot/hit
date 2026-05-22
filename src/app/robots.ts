import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://tophitt.ru";

const commonDisallow = ["/admin", "/api/admin/", "/api/user/", "/api/analytics", "/api/callback", "/api/quick-order", "/api/stock-alert", "/checkout", "/account", "/cart", "/compare", "/wishlist", "/wholesale?*"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: ["/", "/api/merchant-feed", "/api/yandex-feed", "/api/products", "/api/categories", "/uploads/"],
        disallow: commonDisallow,
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/uploads/"],
        disallow: ["/admin"],
      },
      {
        userAgent: "Yandex",
        allow: ["/", "/api/yandex-feed", "/api/merchant-feed", "/api/products", "/api/categories", "/uploads/"],
        disallow: commonDisallow,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/checkout", "/account", "/cart", "/compare", "/wishlist", "/wholesale?*"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
