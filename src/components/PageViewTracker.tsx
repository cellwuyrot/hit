"use client";

import { useEffect } from "react";

function getVisitorId(): string {
  let id = localStorage.getItem("visitorId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("visitorId", id);
  }
  return id;
}

export default function PageViewTracker() {
  useEffect(() => {
    const visitorId = getVisitorId();
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, visitorId }),
    }).catch(() => {});
  }, []);

  return null;
}
