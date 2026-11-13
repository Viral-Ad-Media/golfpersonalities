import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { SITE_URL } from "@/lib/format";
import "./globals.css";

const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const heading = Outfit({ variable: "--font-heading", subsets: ["latin"], weight: ["500", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Golf Personalities", template: "%s | Golf Personalities" },
  description:
    "Profiles, stories and guides about golf's biggest personalities, their families, and the game around them.",
  openGraph: { siteName: "Golf Personalities", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
