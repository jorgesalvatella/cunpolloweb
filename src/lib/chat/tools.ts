import { tool, zodSchema } from "ai";
import { z } from "zod";
import {
  getMenuItemsFromDB,
  getCategoriesFromDB,
  getActivePromotions,
  calculateEffectivePrice,
} from "@/lib/menu-data";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { MenuItem } from "@/types/menu";

function formatItem(item: MenuItem, locale: "es" | "en") {
  const effectivePrice = calculateEffectivePrice(item);
  const hasDiscount = effectivePrice < item.price;
  return {
    id: item.id,
    name: item.name[locale],
    description: item.description[locale],
    price: item.price,
    effectivePrice,
    hasDiscount,
    image: item.image,
    tags: item.tags,
    isPromo: item.promo || false,
    categoryId: item.categoryId,
  };
}

export function getChatTools(locale: "es" | "en") {
  return {
    search_menu: tool({
      description:
        "Search the menu for items matching a query. Use this to find products by name, category, or description.",
      inputSchema: zodSchema(
        z.object({
          query: z.string().describe("Search query — product name, category, or keyword"),
          category: z.string().optional().describe("Optional category ID to filter by"),
        })
      ),
      execute: async ({ query, category }: { query: string; category?: string }) => {
        const items = await getMenuItemsFromDB();

        const normalize = (s: string) =>
          s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // Split into meaningful words (skip short connectors: de, el, la, con...)
        const words = normalize(query)
          .split(/[^a-z0-9ñ]+/)
          .filter((w) => w.length >= 3);

        let candidates = items.filter((item) => !item.promo);
        if (category) {
          candidates = candidates.filter((item) => item.categoryId === category);
        }

        // Score: name matches weigh more than description; more words matched = higher
        const scored = candidates
          .map((item) => {
            // Tags weigh like the name (e.g. "Pollo entero" tag on whole chickens)
            const name = normalize(
              `${item.name.es} ${item.name.en} ${item.tags.join(" ")}`
            );
            const desc = normalize(`${item.description.es} ${item.description.en}`);
            let score = 0;
            for (const w of words) {
              if (name.includes(w)) score += 3;
              else if (desc.includes(w)) score += 1;
            }
            return { item, score };
          })
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score);

        if (scored.length === 0) {
          // No match: return full menu so the AI can suggest, but flag it
          return {
            matched: false,
            note: "No items matched the query. Full menu returned — suggest the closest options.",
            items: candidates.slice(0, 15).map((item) => formatItem(item, locale)),
            total: candidates.length,
          };
        }

        return {
          matched: true,
          items: scored.slice(0, 10).map((s) => formatItem(s.item, locale)),
          total: scored.length,
        };
      },
    }),

    get_categories: tool({
      description: "Get all active menu categories.",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const categories = await getCategoriesFromDB();
        return categories.map((cat) => ({
          id: cat.id,
          name: cat.name[locale],
          icon: cat.icon,
        }));
      },
    }),

    get_promotions: tool({
      description:
        "Get active promotions and discounts. Use this when the customer asks about deals, offers, or promotions.",
      inputSchema: zodSchema(
        z.object({
          orderType: z.enum(["pickup", "dine_in"]).optional().describe("Filter by order type"),
        })
      ),
      execute: async ({ orderType }: { orderType?: "pickup" | "dine_in" }) => {
        const promos = await getActivePromotions(orderType);
        return promos.map((p) => ({
          id: p.id,
          name: p.name,
          description: locale === "es" ? p.descriptionEs : p.descriptionEn,
          discountType: p.discountType,
          discountValue: p.discountValue,
          targetOrderType: p.targetOrderType,
          minOrderAmount: p.minOrderAmount,
        }));
      },
    }),

    add_to_cart: tool({
      description:
        "Add an item to the customer's cart. Always search the menu first to get the correct item ID.",
      inputSchema: zodSchema(
        z.object({
          menuItemId: z.string().describe("The exact menu item ID from search results"),
          quantity: z.number().min(1).default(1).describe("Quantity to add"),
          itemName: z.string().describe("Item name for confirmation message"),
        })
      ),
      execute: async ({ menuItemId, quantity, itemName }: { menuItemId: string; quantity: number; itemName: string }) => {
        return { action: "addToCart", menuItemId, quantity, itemName };
      },
    }),

    remove_from_cart: tool({
      description:
        "Remove an item from the customer's cart.",
      inputSchema: zodSchema(
        z.object({
          menuItemId: z.string().describe("The menu item ID to remove"),
          itemName: z.string().describe("Item name for confirmation message"),
        })
      ),
      execute: async ({ menuItemId, itemName }: { menuItemId: string; itemName: string }) => {
        return { action: "removeFromCart", menuItemId, itemName };
      },
    }),

    search_knowledge: tool({
      description:
        "Search the knowledge base for extra info like events, party packages, World Cup schedule, seasonal specials, or anything not in the menu. Use this when the customer asks about something beyond the regular menu and FAQs.",
      inputSchema: zodSchema(
        z.object({
          query: z.string().describe("Search query — topic or keyword (e.g. 'fiestas', 'mundial', 'paquetes')"),
        })
      ),
      execute: async ({ query }: { query: string }) => {
        const supabase = getSupabaseAdmin();
        const q = query.toLowerCase();

        const { data, error } = await supabase
          .from("bot_knowledge")
          .select("title, content, category")
          .eq("active", true);

        if (error || !data || data.length === 0) {
          return { results: [], message: "No extra information available on this topic." };
        }

        // Simple text search across title and content
        const matches = data.filter(
          (entry) =>
            entry.title.toLowerCase().includes(q) ||
            entry.content.toLowerCase().includes(q) ||
            entry.category.toLowerCase().includes(q)
        );

        if (matches.length === 0) {
          // Return all entries as fallback (the AI can pick what's relevant)
          return {
            results: data.slice(0, 5).map((e) => ({
              title: e.title,
              content: e.content,
              category: e.category,
            })),
          };
        }

        return {
          results: matches.slice(0, 5).map((e) => ({
            title: e.title,
            content: e.content,
            category: e.category,
          })),
        };
      },
    }),
  };
}
