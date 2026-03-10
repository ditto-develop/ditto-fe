"use client";

import { createContext, useContext, useState } from "react";

type HomeReadyContextType = {
  isHomeReady: boolean;
  setHomeReady: (ready: boolean) => void;
};

const HomeReadyContext = createContext<HomeReadyContextType>({
  isHomeReady: false,
  setHomeReady: () => {},
});

export function HomeReadyProvider({ children }: { children: React.ReactNode }) {
  const [isHomeReady, setHomeReady] = useState(false);
  return (
    <HomeReadyContext.Provider value={{ isHomeReady, setHomeReady }}>
      {children}
    </HomeReadyContext.Provider>
  );
}

export const useHomeReady = () => useContext(HomeReadyContext);
