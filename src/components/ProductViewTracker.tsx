"use client";

import { useEffect } from "react";
import { trackProductView } from "@/components/RecentlyViewed";

interface ProductViewTrackerProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
}

export default function ProductViewTracker({ id, name, slug, price, image }: ProductViewTrackerProps) {
  useEffect(() => {
    trackProductView({ id, name, slug, price, image });
  }, [id, name, slug, price, image]);

  return null;
}
