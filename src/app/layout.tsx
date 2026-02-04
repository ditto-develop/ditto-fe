import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import ClientLayout from "./ClientLayout";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Ditto",
  description: "Ditto Description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="ko">
      <body>
        <ClientLayout>
            <ToastProvider>
              {children}
            </ToastProvider>
        </ClientLayout>
      </body>
    </html>
  );
}
