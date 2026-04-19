import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { HomeReadyProvider } from "@/context/HomeReadyContext";
import { ToastProvider } from "@/context/ToastContext";
import { ClientLayout } from "./ClientLayout";

const pretendardJP = localFont({
  src: "../styles/fonts/pretendard/PretendardJPVariable.woff2",
  variable: "--font-pretendard-jp",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Ditto",
  description: "Ditto Description",
  icons: {
    icon: "/assets/app/icon.svg",
    apple: "/assets/app/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log('[src/app/layout.tsx] RootLayout'); // __component_log__
  
  return (
    <html lang="ko" className={pretendardJP.variable}>
      <head>
        <link rel="preload" as="image" href="/assets/logo/ditto.svg" />
      </head>
      <body>
        <HomeReadyProvider>
          <ClientLayout>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ClientLayout>
        </HomeReadyProvider>
      </body>
    </html>
  );
}
