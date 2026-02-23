import { categories } from "./categories";
import { menuItems } from "./menu-items";
import type { MenuItem, MenuCategory } from "@/types/menu";

export function getCategories(): MenuCategory[] {
  return categories.sort((a, b) => a.order - b.order);
}

export function getMenuItems(categoryId?: string): MenuItem[] {
  const items = menuItems.filter((item) => item.available);
  if (categoryId) {
    return items.filter((item) => item.categoryId === categoryId);
  }
  return items;
}

export function getFeaturedItems(): MenuItem[] {
  return menuItems.filter(
    (item) => item.available && item.tags.includes("popular")
  );
}

export function getMenuItemById(id: string): MenuItem | undefined {
  return menuItems.find((item) => item.id === id);
}
