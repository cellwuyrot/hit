import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ТОПХИТ — Интернет-магазин",
    short_name: "ТОПХИТ",
    description: "Интернет-магазин товаров оптом и в розницу по выгодным ценам",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fa",
    theme_color: "#e94560",
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
