import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BrandHeader } from "@/components/BrandHeader";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BrandHeader />
      {children}
    </>
  );
}
