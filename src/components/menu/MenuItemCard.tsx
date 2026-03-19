"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import { FEATURES } from "@/lib/constants";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import type { MenuItem, MenuItemTag } from "@/types/menu";
import type { Locale } from "@/i18n/config";

export default function MenuItemCard({
  item,
  index,
  onSelect,
}: {
  item: MenuItem;
  index: number;
  onSelect: (item: MenuItem) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("menu");
  const { addItem } = useCart();
  const { getEffectivePrice } = useMenu();
  const effectivePrice = getEffectivePrice(item);
  const hasDiscount = effectivePrice < item.price;
  const [justAdded, setJustAdded] = useState(false);

  const tagLabels: Record<MenuItemTag, string> = {
    popular: t("popular"),
    spicy: t("spicy"),
    new: t("new"),
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(item.id, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(item)}
      className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow text-left cursor-pointer w-full border border-gold-400/20"
    >
      <div className={`flex items-center justify-center p-3 ${index % 2 === 0 ? "bg-gold-500" : "bg-red-600"}`}>
        <Image
          src={item.image}
          alt={item.name[locale]}
          width={500}
          height={500}
          className="w-full h-auto rounded-lg"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
        {FEATURES.ORDERING_ENABLED && !item.promo && (
          <motion.div
            className="absolute bottom-2 right-2"
            initial={false}
            animate={justAdded ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <span
              role="button"
              tabIndex={0}
              onClick={handleQuickAdd}
              onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd(e as unknown as React.MouseEvent); }}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full shadow-md transition-colors ${
                justAdded
                  ? "bg-green-500 text-white"
                  : "bg-gold-500 text-white hover:bg-gold-600"
              }`}
            >
              {justAdded ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </span>
          </motion.div>
        )}
      </div>
      <div className="p-2.5 sm:p-4">
        <div className="flex items-start justify-between gap-1 sm:gap-2 mb-0.5 sm:mb-1">
          <h3 className="font-semibold text-dark text-xs sm:text-sm leading-tight">
            {item.name[locale]}
          </h3>
          {!item.promo && (
            <span className="text-gold-500 font-bold text-xs sm:text-sm whitespace-nowrap">
              {hasDiscount ? (
                <>
                  <span className="line-through text-dark/30 font-normal mr-0.5">${item.price}</span>
                  ${effectivePrice}
                </>
              ) : (
                `$${item.price}`
              )}
            </span>
          )}
        </div>
        {item.promo ? (
          <p className="text-[10px] sm:text-xs text-red-600 font-semibold mb-2 sm:mb-3">
            {t("dineInOnly")}
          </p>
        ) : (
          <p className="text-[10px] sm:text-xs text-dark/50 mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2">
            {item.description[locale]}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {item.tags.map((tag) => (
              <Badge key={tag} tag={tag} label={tagLabels[tag]} />
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
}
