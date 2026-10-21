import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Spotlight } from "@/components/Spotlight";
import { Toaster } from "@/components/Toaster";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Cinetable", template: "%s · Cinetable" },
  description: "Il gioco del cineforum: candida un film in segreto, vota, scopri i vincitori alla serata finale.",
  // solo la home è indicizzabile (la sovrascrive in page.tsx)
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#1a1718" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-backdrop text-ink antialiased">
        <Spotlight />
        {/* 640px; le pagine con due colonne (data-wide) allargano tutto, header e footer compresi; la landing (data-landing) è a 720px con il suo footer */}
        <div className="column group/column mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-4 has-[[data-landing]]:max-w-[720px] md:has-[[data-wide]]:max-w-[960px]">
          <main className="flex-1 pt-6">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
