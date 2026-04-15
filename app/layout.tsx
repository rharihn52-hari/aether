import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Aether — Beyond Ordinary Intelligence", description: "AI Creative Engine by Hari Rajanala" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><div className="ambient" />{children}</body></html>;
}
