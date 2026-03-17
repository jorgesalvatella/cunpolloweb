"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import CategoryTabs from "./CategoryTabs";
import MenuItemCard from "./MenuItemCard";
import MenuItemModal from "./MenuItemModal";
import { useMenu } from "@/context/MenuContext";
import type { MenuItem } from "@/types/menu";

export default function MenuContainer() {
  const t = useTranslations("menu");
  const { categories, items: allItems, loading } = useMenu();
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
      <div className="sticky top-[4.5rem] sm:top-20 md:top-24 z-30 bg-white/95 backdrop-blur-sm py-2 sm:py-3 border-b border-red-500/10">
        <CategoryTabs
          categories={categories}
          activeId={activeCategoryId}
          allLabel={t("all")}
          onSelect={setActiveCategoryId}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-4 sm:mt-6">
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
