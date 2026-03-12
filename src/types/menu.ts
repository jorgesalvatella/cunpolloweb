export type BilingualText = {
  es: string;
  en: string;
};

export type MenuCategory = {
  id: string;
  name: BilingualText;
  icon: string;
  order: number;
};

export type MenuItemTag = "popular" | "spicy" | "new";

export type MenuItem = {
  id: string;
  categoryId: string;
  name: BilingualText;
  description: BilingualText;
  price: number;
  image: string;
  tags: MenuItemTag[];
  available: boolean;
  promo?: boolean;
};
