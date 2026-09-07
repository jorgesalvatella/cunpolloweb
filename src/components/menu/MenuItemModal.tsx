"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "@/components/ui/Badge";
import { useState } from "react";
import { FEATURES } from "@/lib/constants";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import type { MenuItem, MenuItemTag } from "@/types/menu";
import type { Locale } from "@/i18n/config";

export default function MenuItemModal({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("menu");
  const { addItem } = useCart();
  const { getEffectivePrice } = useMenu();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const effectivePrice = item ? getEffectivePrice(item) : 0;
  const hasDiscount = item ? effectivePrice < item.price : false;

  const tagLabels: Record<MenuItemTag, string> = {
    popular: t("popular"),
    spicy: t("spicy"),
    new: t("new"),
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-2 rounded-t-2xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-y-auto"
          >
            {/* Image area */}
            <div className="flex items-center justify-center p-6">
              <Image
                src={item.image}
                alt={item.name[locale]}
                width={500}
                height={500}
                className="w-full h-auto rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)]"
                sizes="(max-width: 640px) 100vw, 512px"
              />
              <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-ink hover:bg-white/20 transition-colors cursor-pointer"
                aria-label={t("close")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-ink font-(family-name:--font-heading)">
                  {item.name[locale]}
                </h2>
                {!item.promo && (
                  <span className="text-xl sm:text-2xl font-bold text-gold-400 shrink-0">
                    {hasDiscount ? (
                      <>
                        <span className="line-through text-white/30 font-normal text-base sm:text-lg mr-1">${item.price}</span>
                        ${effectivePrice}
                      </>
                    ) : (
                      `$${item.price}`
                    )}
                  </span>
                )}
              </div>

              {item.tags.length > 0 && (
                <div className="flex gap-2 mb-3 sm:mb-4 flex-wrap">
                  {item.tags.map((tag) => (
                    <Badge key={tag} tag={tag} label={tagLabels[tag]} />
                  ))}
                </div>
              )}

              <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-2">
                {t("description")}
              </h3>
              <p className="text-white/70 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                {item.description[locale]}
              </p>

              {item.promo && (
                <p className="text-sm font-semibold text-red-300 text-center mt-2">
                  {t("dineInOnly")}
                </p>
              )}

              {!item.promo && (
                <p className="text-xs sm:text-sm text-white/30 text-center">
                  {t("currency")}: MXN
                </p>
              )}

              {FEATURES.ORDERING_ENABLED && !item.promo && (
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-ink hover:bg-white/15 transition-colors cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-ink hover:bg-white/15 transition-colors cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      addItem(item.id, quantity);
                      setAdded(true);
                      setTimeout(() => {
                        setAdded(false);
                        setQuantity(1);
                        onClose();
                      }, 800);
                    }}
                    className={`w-full px-6 py-3 font-semibold rounded-full transition-colors cursor-pointer ${
                      added
                        ? "bg-green-500 text-white"
                        : "bg-gold-500 text-white hover:bg-gold-600"
                    }`}
                  >
                    {added ? "✓" : `${t("addToOrder")} — $${effectivePrice * quantity}`}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
