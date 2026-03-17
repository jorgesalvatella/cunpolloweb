import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  MenuItem,
  MenuCategory,
  Promotion,
  DbMenuItem,
  DbCategory,
  DbPromotion,
  MenuItemTag,
} from "@/types/menu";

// --- Converters ---

export function dbToMenuItem(row: DbMenuItem): MenuItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: { es: row.name_es, en: row.name_en },
    description: { es: row.description_es, en: row.description_en },
    price: row.price,
    image: row.image,
    tags: (row.tags ?? []) as MenuItemTag[],
    available: row.available,
    promo: row.is_promo || undefined,
    discountPercent: row.discount_percent,
    discountFixed: row.discount_fixed,
  };
}

export function dbToCategory(row: DbCategory): MenuCategory {
  return {
    id: row.id,
    name: { es: row.name_es, en: row.name_en },
    icon: row.icon,
    order: row.sort_order,
  };
}

function dbToPromotion(row: DbPromotion): Promotion {
  return {
    id: row.id,
    name: row.name,
    descriptionEs: row.description_es,
    descriptionEn: row.description_en,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    targetOrderType: row.target_order_type,
    minOrderAmount: row.min_order_amount,
    active: row.active,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

// --- Data fetchers ---

export async function getMenuItemByIdFromDB(
  id: string
): Promise<MenuItem | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return dbToMenuItem(data as DbMenuItem);
}

export async function getMenuItemsFromDB(): Promise<MenuItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("available", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as DbMenuItem[]).map(dbToMenuItem);
}

export async function getCategoriesFromDB(): Promise<MenuCategory[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as DbCategory[]).map(dbToCategory);
}

export async function getActivePromotions(
  orderType?: string
): Promise<Promotion[]> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  let query = supabase.from("promotions").select("*").eq("active", true);

  // Filter by order type: match exact type or "all"
  if (orderType) {
    query = query.or(
      `target_order_type.eq.${orderType},target_order_type.eq.all`
    );
  }

  const { data, error } = await query;

  if (error || !data) return [];

  // Filter by date range in JS (Supabase nullable date handling)
  const rows = (data as DbPromotion[]).filter((row) => {
    if (row.starts_at && new Date(row.starts_at) > new Date(now)) return false;
    if (row.ends_at && new Date(row.ends_at) < new Date(now)) return false;
    return true;
  });

  return rows.map(dbToPromotion);
}

// --- Price & discount helpers ---

/**
 * Calculates the effective price after per-product discount.
 * discount_fixed takes precedence over discount_percent.
 */
export function calculateEffectivePrice(item: MenuItem): number {
  if (item.discountFixed != null && item.discountFixed > 0) {
    return Math.max(0, item.price - item.discountFixed);
  }
  if (item.discountPercent != null && item.discountPercent > 0) {
    return Math.max(
      0,
      Math.round(item.price * (1 - item.discountPercent / 100))
    );
  }
  return item.price;
}

/**
 * Picks the best applicable order-level promotion and returns the discount.
 * "Best" = highest discount amount for the given subtotal.
 */
export function calculateOrderDiscount(
  subtotal: number,
  orderType: string,
  promotions: Promotion[]
): { amount: number; description: string; promotionId: string | null } {
  let bestAmount = 0;
  let bestDescription = "";
  let bestId: string | null = null;

  for (const promo of promotions) {
    // Check order type match
    if (
      promo.targetOrderType !== "all" &&
      promo.targetOrderType !== orderType
    ) {
      continue;
    }

    // Check minimum order amount
    if (subtotal < promo.minOrderAmount) {
      continue;
    }

    let amount = 0;
    if (promo.discountType === "fixed") {
      amount = promo.discountValue;
    } else if (promo.discountType === "percent") {
      amount = Math.round(subtotal * (promo.discountValue / 100));
    }

    // Cannot discount more than the subtotal
    amount = Math.min(amount, subtotal);

    if (amount > bestAmount) {
      bestAmount = amount;
      bestDescription = promo.name;
      bestId = promo.id;
    }
  }

  return {
    amount: bestAmount,
    description: bestDescription,
    promotionId: bestId,
  };
}
