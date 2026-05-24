"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SettingEntry {
  id: string;
  value: string;
}

interface SiteSettingsContextValue {
  settings: Record<string, SettingEntry>;
  get: (key: string, fallback?: string) => string;
  getId: (key: string) => string | null;
  loaded: boolean;
  reload: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: {},
  get: (_key: string, fallback = "") => fallback,
  getId: () => null,
  loaded: false,
  reload: () => {},
});

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function SiteSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<Record<string, SettingEntry>>({});
  const [loaded, setLoaded] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/site-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setLoaded(true);
      }
    } catch {
      // silently fail - use defaults
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const get = useCallback(
    (key: string, fallback = "") => {
      return settings[key]?.value ?? fallback;
    },
    [settings]
  );

  const getId = useCallback(
    (key: string) => {
      return settings[key]?.id ?? null;
    },
    [settings]
  );

  return (
    <SiteSettingsContext.Provider
      value={{ settings, get, getId, loaded, reload: fetchSettings }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}
