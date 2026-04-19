import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "@/style/global.css";

const openSans = Open_Sans({
   subsets: ["latin", "cyrillic"],
   weight: ["300", "400", "500", "600", "700"],
   display: "swap",
   variable: "--font-open-sans",
});

export const metadata: Metadata = {
   title: "Way Lang",
   description: "Learn English easily",
   icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      apple: "/apple-touch-icon.png",
   },
   manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
   width: "device-width",
   initialScale: 1,
};

export default function RootLayout({
   children,
}: Readonly<{
   children: ReactNode;
}>) {
   return (
      <html lang="en" className={openSans.variable} suppressHydrationWarning>
         <body>{children}</body>
      </html>
   );
}
