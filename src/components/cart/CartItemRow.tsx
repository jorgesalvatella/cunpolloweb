"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { getMenuItemById } from "@/data";
import type { CartItem } from "@/types/order";
import type { Locale } from "@/i18n/config";

export default function CartItemRow({ item }: { item: CartItem }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("cart");
  const { updateQuantity, removeItem } = useCart();
  const menuItem = getMenuItemById(item.menuItemId);

  if (!menuItem) return null;

  const lineTotal = menuItem.price * item.quantity;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100">
      <div className="w-12 h-12 bg-red-50 rounded-lg relative overflow-hidden shrink-0">
        <Image
          src={menuItem.image}
          alt={menuItem.name[locale]}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-dark truncate">{menuItem.name[locale]}</h3>
        <p className="text-sm text-dark/50">${menuItem.price} c/u</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-dark hover:bg-gray-200 transition-colors cursor-pointer"
          aria-label={t("decrease")}
        >
          -
        </button>
        <span className="w-8 text-center font-semibold">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-dark hover:bg-gray-200 transition-colors cursor-pointer"
          aria-label={t("increase")}
        >
          +
        </button>
      </div>

      <span className="font-bold text-dark w-20 text-right">${lineTotal}</span>

      <button
        onClick={() => removeItem(item.menuItemId)}
        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-1"
        aria-label={t("remove")}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
