import type { Metadata } from "next";
import { Vazirmatn, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = Vazirmatn({ subsets: ["arabic"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "املاین",
  description: "زیرساخت دیجیتال املاک و قرارداد"
};

const SANITIZE_JS = `(function(){try{var doc=document;
function rmSel(sel){try{var list=doc.querySelectorAll(sel);for(var i=0;i<list.length;i++){list[i].remove();}}catch(e){}}
function rmId(id){try{var el=doc.getElementById(id);if(el) el.remove();}catch(e){}}
function cleanup(){
  try{
    // Remove illegal element nodes directly under document (can break hydration).
    var kids=Array.prototype.slice.call(doc.childNodes||[]);
    for(var i=0;i<kids.length;i++){
      var n=kids[i];
      if(n && n.nodeType===1 && n!==doc.documentElement){try{n.parentNode && n.parentNode.removeChild(n);}catch(e){}}
    }
  }catch(e){}
  rmId("monica-content-root");
  rmSel("veepn-lock-screen,.monica-widget,[data-monica-widget],[id^='monica'],[class*='monica']");
}
cleanup();

// Prevent extensions from appending elements directly to document (throws HierarchyRequestError).
var queued=[];
var origAppend=doc.appendChild;
doc.appendChild=function(node){
  try{
    if(node && node.nodeType===1 && node!==doc.documentElement){
      if(doc.body) return doc.body.appendChild(node);
      queued.push(node); return node;
    }
    return origAppend.call(this,node);
  }catch(e){return node;}
};
var origInsert=doc.insertBefore;
doc.insertBefore=function(node,ref){
  try{
    if(node && node.nodeType===1 && node!==doc.documentElement){
      if(doc.body) return doc.body.insertBefore(node, doc.body.firstChild);
      queued.push(node); return node;
    }
    return origInsert.call(this,node,ref);
  }catch(e){return node;}
};
function flush(){
  try{ if(!doc.body) return; while(queued.length){ try{doc.body.appendChild(queued.shift());}catch(e){queued.shift();} } }catch(e){}
}

if(doc.readyState==="loading"){doc.addEventListener("DOMContentLoaded",function(){flush();cleanup();},{once:true});} else {flush();cleanup();}

// Short-lived observer: keep document/body clean during early hydration.
var start=Date.now();
var mo=new MutationObserver(function(){cleanup();flush(); if(Date.now()-start>2500){try{mo.disconnect();}catch(e){}}});
try{mo.observe(doc,{childList:true,subtree:true});}catch(e){}
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-sans), system-ui" }} suppressHydrationWarning>
        <script id="amline-sanitize" dangerouslySetInnerHTML={{ __html: SANITIZE_JS }} />
        <div id="amline-root">{children}</div>
      </body>
    </html>
  );
}
