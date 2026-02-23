"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import CategoryTabs from "./CategoryTabs";
import MenuItemCard from "./MenuItemCard";
import MenuItemModal from "./MenuItemModal";
import { getCategories, getMenuItems } from "@/data";
import type { MenuItem } from "@/types/menu";

export default function MenuContainer() {
  const t = useTranslations("menu");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const categories = getCategories();
  const items = useMemo(
    () => getMenuItems(activeCategoryId ?? undefined),
    [activeCategoryId]
  );

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
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
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
