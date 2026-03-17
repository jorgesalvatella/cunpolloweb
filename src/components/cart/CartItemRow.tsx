"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import type { CartItem } from "@/types/order";
import type { Locale } from "@/i18n/config";

export default function CartItemRow({ item }: { item: CartItem }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("cart");
  const { updateQuantity, removeItem } = useCart();
  const { getItemById, getEffectivePrice } = useMenu();
  const menuItem = getItemById(item.menuItemId);

  if (!menuItem) return null;

  const effectivePrice = getEffectivePrice(menuItem);
  const hasDiscount = effectivePrice < menuItem.price;
  const lineTotal = effectivePrice * item.quantity;

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100">
      {/* Thumbnail */}
      <div className="w-16 h-16 sm:w-12 sm:h-12 bg-red-50 rounded-lg relative overflow-hidden shrink-0">
        <Image
          src={menuItem.image}
          alt={menuItem.name[locale]}
          fill
          className="object-cover"
          sizes="64px"
          unoptimized
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top: name + delete */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-dark text-sm sm:text-base leading-tight">
              {menuItem.name[locale]}
            </h3>
            <p className="text-xs sm:text-sm text-dark/50 mt-0.5">
              {hasDiscount ? (
                <>
                  <span className="line-through mr-1">${menuItem.price}</span>
                  <span className="text-red-600 font-medium">${effectivePrice}</span>
                </>
              ) : (
                `$${menuItem.price}`
              )}{" "}
              c/u
            </p>
          </div>
          <button
            onClick={() => removeItem(item.menuItemId)}
            className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-1 shrink-0"
            aria-label={t("remove")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Bottom: quantity controls + line total */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-dark hover:bg-gray-200 transition-colors cursor-pointer text-sm font-medium"
              aria-label={t("decrease")}
            >
              -
            </button>
            <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-dark hover:bg-gray-200 transition-colors cursor-pointer text-sm font-medium"
              aria-label={t("increase")}
            >
              +
            </button>
          </div>
          <span className="font-bold text-dark text-sm sm:text-base">${lineTotal}</span>
        </div>
      </div>
    </div>
  );
}
