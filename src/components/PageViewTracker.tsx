"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getVisitorId(): string {
  const key = "_vid";
  const vid = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
  if (vid) return vid[1];
  const id = crypto.randomUUID();
  document.cookie = `${key}=${id}; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax`;
  return id;
}

function sendView(path: string) {
  const vid = getVisitorId();
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, vid, ...(path.startsWith("/campaign/") ? { source: new URLSearchParams(window.location.search).get("utm_source"), medium: new URLSearchParams(window.location.search).get("utm_medium") } : {}) }),
  }).catch(() => {});
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const prev = useRef<string>("");

  useEffect(() => {
    if (pathname && pathname !== prev.current) {
      // Первый просмотр уже отправляет стандартный код счётчика. Для переходов Next.js
      // сообщаем Метрике виртуальный просмотр, сохраняя UTM в текущем URL.
      if (prev.current) {
        const ym = (window as Window & { ym?: (...args: unknown[]) => void }).ym;
        if (typeof ym === "function") ym(109327312, "hit", window.location.href);
      }
      prev.current = pathname;
      sendView(pathname);
    }
  }, [pathname]);

  return null;
}
