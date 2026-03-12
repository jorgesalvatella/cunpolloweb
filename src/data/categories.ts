import type { MenuCategory } from "@/types/menu";

export const categories: MenuCategory[] = [
  {
    id: "promociones",
    name: { es: "Promociones", en: "Promotions" },
    icon: "🎉",
    order: 0,
  },
  {
    id: "especialidad",
    name: { es: "Nuestra Especialidad", en: "Our Specialty" },
    icon: "🍗",
    order: 1,
  },
  {
    id: "lo-mero-bueno",
    name: { es: "Lo Mero Bueno", en: "The Good Stuff" },
    icon: "🔥",
    order: 2,
  },
  {
    id: "antojitos",
    name: { es: "Antojitos Caseros", en: "Homestyle Snacks" },
    icon: "🌮",
    order: 3,
  },
  {
    id: "acompañamientos",
    name: { es: "Acompañamientos", en: "Sides" },
    icon: "🥗",
    order: 4,
  },
  {
    id: "bebidas",
    name: { es: "Bebidas", en: "Drinks" },
    icon: "🥤",
    order: 5,
  },
  {
    id: "postres",
    name: { es: "Postres", en: "Desserts" },
    icon: "🍮",
    order: 6,
  },
  {
    id: "combos",
    name: { es: "Combos", en: "Combos" },
    icon: "⭐",
    order: 7,
  },
];
