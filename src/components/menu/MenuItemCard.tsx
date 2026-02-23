"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import type { MenuItem, MenuItemTag } from "@/types/menu";
import type { Locale } from "@/i18n/config";

export default function MenuItemCard({
  item,
  onSelect,
}: {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("menu");

  const tagLabels: Record<MenuItemTag, string> = {
    popular: t("popular"),
    spicy: t("spicy"),
    new: t("new"),
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
      <div className="h-28 sm:h-40 bg-red-50 flex items-center justify-center">
        <span className="text-3xl sm:text-5xl">🍗</span>
      </div>
      <div className="p-2.5 sm:p-4">
        <div className="flex items-start justify-between gap-1 sm:gap-2 mb-0.5 sm:mb-1">
          <h3 className="font-semibold text-dark text-xs sm:text-sm leading-tight">
            {item.name[locale]}
          </h3>
          <span className="text-gold-500 font-bold text-xs sm:text-sm whitespace-nowrap">
            ${item.price}
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-dark/50 mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
          {item.description[locale]}
        </p>
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
