"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface RightPanelCtx {
  rightPanel: ReactNode;
  setRightPanel: (node: ReactNode) => void;
}

const Ctx = createContext<RightPanelCtx>({
  rightPanel: null,
  setRightPanel: () => {},
});

export function RightPanelProvider({ children }: { children: ReactNode }) {
  const [rightPanel, setRightPanelState] = useState<ReactNode>(null);
  const setRightPanel = useCallback((node: ReactNode) => setRightPanelState(node), []);
  return <Ctx.Provider value={{ rightPanel, setRightPanel }}>{children}</Ctx.Provider>;
}

export function useRightPanel() {
  return useContext(Ctx);
}
