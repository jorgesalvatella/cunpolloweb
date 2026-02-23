import type { MenuCategory } from "@/types/menu";

export const categories: MenuCategory[] = [
  {
    id: "pollos",
    name: { es: "Pollos", en: "Chicken" },
    icon: "🍗",
    order: 1,
  },
  {
    id: "complementos",
    name: { es: "Complementos", en: "Sides" },
    icon: "🥗",
    order: 2,
  },
  {
    id: "bebidas",
    name: { es: "Bebidas", en: "Drinks" },
    icon: "🥤",
    order: 3,
  },
  {
    id: "combos",
    name: { es: "Combos", en: "Combos" },
    icon: "⭐",
    order: 4,
  },
];
