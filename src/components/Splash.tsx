"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

const SplashWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: white;
  font-size: 2rem;
`;

const Logo = styled.p`
  font-family: 'IM Fell Double Pica';
  font-style: italic;
  font-size: 120px;
  font-weight: 400;
  line-height: normal;
  -webkit-text-stroke-width: 2px;
  -webkit-text-stroke-color: #000;

`;

export default function SplashLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); 
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div style={{overflow: "hidden", width:"100%"}}>
        <AnimatePresence mode="wait">
            <motion.div
                key={1} // 클릭할 때마다 새 key
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
                <SplashWrapper>
                <Logo>ditto</Logo>
                </SplashWrapper>
            </motion.div>
        </AnimatePresence>
    </div>;
  }

  return <>{children}</>;
}
