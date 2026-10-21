import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Cinofili", template: "%s · Cinofili" },
  description: "Il gioco del cineforum: candida un film in segreto, vota, scopri i vincitori alla serata finale.",
  // solo la home è indicizzabile (la sovrascrive in page.tsx)
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#1a1718" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-bg text-ink antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-4">
          <main className="flex-1 pt-6">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
