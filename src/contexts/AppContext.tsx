"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type AppContextType = {
  capturedImg: string;
  setCapturedImg: (v: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [capturedImg, setCapturedImg] = useState("");

  return (
    <AppContext.Provider value={{ capturedImg, setCapturedImg }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
