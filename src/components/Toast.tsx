"use client";

import { useState, useEffect } from "react";

export default function Toast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      setMessage(e.detail);
      setVisible(true);
      setTimeout(() => setVisible(false), 2500);
    };
    window.addEventListener("show-toast", handler as EventListener);
    return () => window.removeEventListener("show-toast", handler as EventListener);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-text-dark text-white px-5 py-3 rounded-lg shadow-lg text-sm animate-fade-in">
      {message}
    </div>
  );
}

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent("show-toast", { detail: message }));
}
