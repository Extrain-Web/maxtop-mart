import type { Metadata } from "next";
import { Poppins, Teko } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/redux";
import FloatingContact from "@/components/shared/FloatingContact";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

// Self-hosted via next/font — no render-blocking Google Fonts <link>, automatic
// font-display: swap, and no layout shift. Exposed as CSS variables that
// globals.css maps onto --font-family / --font-heading.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const teko = Teko({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-teko",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Maxtop Mart — Your trusted online marketplace",
    template: "%s | Maxtop Mart",
  },
  description: "Shop quality products at the best prices with Maxtop Mart, your trusted online marketplace in Bangladesh.",
  keywords: ["maxtop mart", "maxtopmart", "online shopping", "ecommerce", "bangladesh", "marketplace", "best deals", "products"],
  applicationName: "Maxtop Mart",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Maxtop Mart",
    title: "Maxtop Mart — Your trusted online marketplace",
    description: "Shop quality products at the best prices with Maxtop Mart, your trusted online marketplace in Bangladesh.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maxtop Mart — Your trusted online marketplace",
    description: "Shop quality products at the best prices with Maxtop Mart, your trusted online marketplace in Bangladesh.",
  },
  robots: { index: true, follow: true },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${teko.variable}`}>
      <body>
        <ReduxProvider>
          <ThemeProvider>
            <Toaster position="top-center" reverseOrder={false} />
            {children}
            <FloatingContact />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
