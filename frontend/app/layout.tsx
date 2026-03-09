import type { Metadata } from "next";
import Script from "next/script";
import { Vazirmatn, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = Vazirmatn({ subsets: ["arabic"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "املاین",
  description: "زیرساخت دیجیتال املاک و قرارداد"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Some browser extensions inject nodes into <body> before hydration and can trigger
  // React hydration edge-cases (blank page). We sanitize a few known offenders.
  return (
    <html lang="fa" dir="rtl" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <Script id="amline-sanitize" strategy="beforeInteractive">
          {`(function(){try{
            var ids=["monica-content-root"]; 
            for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]); if(el) el.remove();}
            var tags=["veepn-lock-screen"]; 
            for(var j=0;j<tags.length;j++){var els=document.getElementsByTagName(tags[j]); while(els && els.length){els[0].remove();}}
            var cls=["monica-widget"]; 
            for(var k=0;k<cls.length;k++){var nodes=document.getElementsByClassName(cls[k]); while(nodes && nodes.length){nodes[0].remove();}}
          }catch(e){}})();`}
        </Script>
      </head>
      <body style={{ fontFamily: "var(--font-sans), system-ui" }} suppressHydrationWarning>
        <div id="amline-root">{children}</div>
      </body>
    </html>
  );
}
