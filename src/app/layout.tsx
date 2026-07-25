import type { Metadata, Viewport } from "next";
import { Open_Sans, Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";

import "@/style/global.scss";

const openSans = Open_Sans({
   subsets: ["latin", "cyrillic"],
   weight: ["300", "400", "500", "600", "700"],
   display: "swap",
   variable: "--font-open-sans",
});

// Акцентный шрифт: переменная --font-playfair-display + режим
// «Playfair для текста вопроса» (тумблер SpeakableFontToggle)
const playfair = Playfair_Display({
   subsets: ["latin", "cyrillic"],
   style: ["normal", "italic"],
   display: "swap",
   variable: "--font-playfair-display",
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
      <html
         lang="en"
         className={`${openSans.variable} ${playfair.variable}`}
         suppressHydrationWarning
      >
         <body>{children}</body>
      </html>
   );
}
