import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "سند | Share-to-SANAD",
    template: "%s | سند",
  },
  description: "تطبيق مشاركة إشعارات العمليات المالية إلى سند لمعالجتها وربطها بالحسابات.",
  applicationName: "SANAD",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EAFBF4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={arabicFont.className}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
