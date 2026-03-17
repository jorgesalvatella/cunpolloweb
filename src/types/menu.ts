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
  discountPercent?: number | null;
  discountFixed?: number | null;
};

// --- DB row types (snake_case, matching Supabase columns) ---

export type DbMenuItem = {
  id: string;
  category_id: string;
  name_es: string;
  name_en: string;
  description_es: string;
  description_en: string;
  price: number;
  image: string;
  tags: string[] | null;
  available: boolean;
  is_promo: boolean;
  discount_percent: number | null;
  discount_fixed: number | null;
  sort_order: number;
};

export type DbCategory = {
  id: string;
  name_es: string;
  name_en: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

export type DbPromotion = {
  id: string;
  name: string;
  description_es: string;
  description_en: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  target_order_type: "pickup" | "dine_in" | "all";
  min_order_amount: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

// --- App-level Promotion type (camelCase) ---

export type Promotion = {
  id: string;
  name: string;
  descriptionEs: string;
  descriptionEn: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  targetOrderType: "pickup" | "dine_in" | "all";
  minOrderAmount: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
};
