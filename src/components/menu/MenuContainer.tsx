"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import CategoryTabs from "./CategoryTabs";
import MenuItemCard from "./MenuItemCard";
import MenuItemModal from "./MenuItemModal";
import RewardsBanner from "./RewardsBanner";
import { useMenu } from "@/context/MenuContext";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MenuItem } from "@/types/menu";

export default function MenuContainer() {
  const t = useTranslations("menu");
  const tCunpacks = useTranslations("cunpacks");
  const locale = useLocale();
  const { categories, items: allItems, promotions, loading } = useMenu();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const items = useMemo(
    () =>
      activeCategoryId
        ? allItems.filter((item) => item.categoryId === activeCategoryId)
        : allItems,
    [activeCategoryId, allItems]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="w-8 h-8 animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div>
      <RewardsBanner />

      {/* Cunpacks promo card */}
      <Link
        href="/cunpacks"
        className="bg-red-600/10 border border-red-500/25 rounded-xl px-4 py-3 flex items-center justify-between gap-3 mb-2 hover:bg-red-600/15 transition-colors"
      >
        <div>
          <p className="font-bold text-red-300 text-sm sm:text-base">{tCunpacks("bannerTitle")}</p>
          <p className="text-gold-400 text-xs">{tCunpacks("bannerSubtitle")}</p>
        </div>
        <svg
          className="w-5 h-5 text-red-300 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Promotion banners */}
      {promotions.length > 0 && (
        <div className="space-y-2 mb-4">
          {promotions.map((promo) => {
            const desc = locale === "es" ? promo.descriptionEs : promo.descriptionEn;
            const typeLabel =
              promo.targetOrderType === "pickup"
                ? locale === "es" ? "Para llevar" : "Pickup"
                : promo.targetOrderType === "dine_in"
                  ? locale === "es" ? "Comer aqui" : "Dine-in"
                  : "";
            return (
              <div
                key={promo.id}
                className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-green-300 text-sm sm:text-base">{desc || promo.name}</p>
                  {typeLabel && (
                    <p className="text-green-400 text-xs">{typeLabel}</p>
                  )}
                </div>
                <span className="text-green-300 font-black text-lg sm:text-xl">
                  -{promo.discountType === "percent" ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="sticky top-[4.5rem] sm:top-20 md:top-24 z-30 bg-surface/85 backdrop-blur-xl py-2 sm:py-3 border-b border-white/10">
        <CategoryTabs
          categories={categories}
          activeId={activeCategoryId}
          allLabel={t("all")}
          onSelect={setActiveCategoryId}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-4 sm:mt-6">
        {activeCategoryId === "promociones" && (
          <Link href="/cunpacks" className="group rounded-xl sm:rounded-2xl text-left w-full">
            <Image
              src="/images/cunpacks/cunpacks-card.webp"
              alt={tCunpacks("bannerTitle")}
              width={900}
              height={520}
              className="w-full h-auto rounded-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] group-hover:shadow-[0_16px_50px_-10px_rgba(232,163,23,0.25)] transition-shadow duration-300"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <div className="p-2.5 sm:p-4">
              <h3 className="font-semibold text-ink text-xs sm:text-sm leading-tight mb-0.5 sm:mb-1">
                {tCunpacks("bannerTitle")}
              </h3>
              <p className="text-[10px] sm:text-xs text-red-300 font-semibold">
                {tCunpacks("bannerSubtitle")}
              </p>
            </div>
          </Link>
        )}
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <MenuItemCard
              key={item.id}
              item={item}
              index={i}
              onSelect={setSelectedItem}
            />
          ))}
        </AnimatePresence>
      </div>

      <MenuItemModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
