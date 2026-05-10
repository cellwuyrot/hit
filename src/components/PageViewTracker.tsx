"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getVisitorId(): string {
  const key = "_vid";
  let vid = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
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
    body: JSON.stringify({ path, vid }),
  }).catch(() => {});
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const prev = useRef<string>("");

  useEffect(() => {
    if (pathname && pathname !== prev.current) {
      prev.current = pathname;
      sendView(pathname);
    }
  }, [pathname]);

  return null;
}
