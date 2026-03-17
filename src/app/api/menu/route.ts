import { NextResponse } from "next/server";
import {
  getCategoriesFromDB,
  getMenuItemsFromDB,
  getActivePromotions,
} from "@/lib/menu-data";

export async function GET() {
  try {
    const [categories, items, promotions] = await Promise.all([
      getCategoriesFromDB(),
      getMenuItemsFromDB(),
      getActivePromotions(),
    ]);

    return NextResponse.json(
      { categories, items, promotions },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching menu data:", error);
    return NextResponse.json(
      { error: "Error loading menu data" },
      { status: 500 }
    );
  }
}
