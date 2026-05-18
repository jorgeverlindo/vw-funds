"use client";

import { createContext, useContext, useState } from "react";

interface SidebarCtx {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
}

export const SidebarContext = createContext<SidebarCtx>({
  sidebarOpen: true,
  setSidebarOpen: () => {},
  toggleSidebar: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar: () => setSidebarOpen((v) => !v),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
