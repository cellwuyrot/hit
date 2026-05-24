"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface InlineEditContextValue {
  editing: boolean;
  setEditing: (v: boolean) => void;
  isAdmin: boolean;
}

const InlineEditContext = createContext<InlineEditContextValue>({
  editing: false,
  setEditing: () => {},
  isAdmin: false,
});

export function useInlineEdit() {
  return useContext(InlineEditContext);
}

export function InlineEditProvider({ children }: { children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    setIsAdmin(!!token);
  }, []);

  return (
    <InlineEditContext.Provider value={{ editing, setEditing, isAdmin }}>
      {children}
    </InlineEditContext.Provider>
  );
}
