import { Montserrat, Inter } from "next/font/google";

export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
