import type { Metadata } from "next";
import { Vazirmatn, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = Vazirmatn({ subsets: ["arabic"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "املاین",
  description: "زیرساخت دیجیتال املاک و قرارداد"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-sans), system-ui" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
