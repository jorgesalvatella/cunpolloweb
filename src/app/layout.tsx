import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { montserrat, inter } from "@/lib/fonts";
import PWARegister from "@/components/PWARegister";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cunpollo.com"),
  title: {
    default: "CUNPOLLO - El Mejor Pollo Rostizado",
    template: "%s | CUNPOLLO",
  },
  description:
    "Descubre el auténtico sabor del pollo rostizado artesanal. Consulta nuestro menú, ubicación y horarios.",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "CUNPOLLO",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://cunpollo.com",
    siteName: "CUNPOLLO",
    locale: "es_MX",
    alternateLocale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CUNPOLLO - Aqui todo lo hacemos con amor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#BC2026",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${montserrat.variable} ${inter.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-dark antialiased">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
