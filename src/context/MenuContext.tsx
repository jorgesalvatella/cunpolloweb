"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { MenuItem, MenuCategory, Promotion } from "@/types/menu";

type MenuContextType = {
  categories: MenuCategory[];
  items: MenuItem[];
  promotions: Promotion[];
  loading: boolean;
  getItemById: (id: string) => MenuItem | undefined;
  getEffectivePrice: (item: MenuItem) => number;
  refetch: () => Promise<void>;
};

const MenuContext = createContext<MenuContextType | null>(null);

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}

function calcEffectivePrice(item: MenuItem): number {
  if (item.discountFixed != null && item.discountFixed > 0) {
    return Math.max(0, item.price - item.discountFixed);
  }
  if (item.discountPercent != null && item.discountPercent > 0) {
    return Math.max(0, Math.round(item.price * (1 - item.discountPercent / 100)));
  }
  return item.price;
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/menu");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setItems(data.items || []);
        setPromotions(data.promotions || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenu();

    // Revalidate on window focus
    const onFocus = () => fetchMenu();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchMenu]);

  const getItemById = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

  return (
    <MenuContext.Provider
      value={{
        categories,
        items,
        promotions,
        loading,
        getItemById,
        getEffectivePrice: calcEffectivePrice,
        refetch: fetchMenu,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}
