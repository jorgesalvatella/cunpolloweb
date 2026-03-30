import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";

import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { MenuProvider } from "@/context/MenuContext";
import CartFloatingButton from "@/components/cart/CartFloatingButton";
import ChatWidget from "@/components/chat/ChatWidget";
import { FEATURES } from "@/lib/constants";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "es" | "en")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <MenuProvider>
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartFloatingButton />
          {FEATURES.CHAT_ENABLED && <ChatWidget />}
        </CartProvider>
      </MenuProvider>
    </NextIntlClientProvider>
  );
}
