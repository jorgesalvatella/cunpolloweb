import type { ReactNode } from "react";
import type { Metadata } from "next";
import { montserrat, inter } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cunpollo.com"),
  title: {
    default: "CUNPOLLO - El Mejor Pollo Rostizado",
    template: "%s | CUNPOLLO",
  },
  description:
    "Descubre el auténtico sabor del pollo rostizado artesanal. Consulta nuestro menú, ubicación y horarios.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "CUNPOLLO",
    locale: "es_MX",
    alternateLocale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 820,
        height: 360,
        alt: "CUNPOLLO - Pollo que salva tu día",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-dark antialiased">
        {children}
      </body>
    </html>
  );
}
