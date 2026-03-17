import { NextResponse } from "next/server";
import { getMenuItemsFromDB, getCategoriesFromDB, calculateEffectivePrice } from "@/lib/menu-data";

const SITE_URL = "https://cunpollo.com";
const BRAND = "CUNPOLLO";
const CURRENCY = "MXN";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [allItems, allCategories] = await Promise.all([
    getMenuItemsFromDB(),
    getCategoriesFromDB(),
  ]);

  const activeItems = allItems.filter(
    (item) => !item.promo && item.id !== "prueba-pasarela"
  );

  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

  const entries = activeItems
    .map((item) => {
      const category = categoryMap.get(item.categoryId);
      const categoryName = category ? escapeXml(category.name.es) : "";

      return `  <entry>
    <g:id>${escapeXml(item.id)}</g:id>
    <g:title>${escapeXml(item.name.es)}</g:title>
    <g:description>${escapeXml(item.description.es)}</g:description>
    <g:availability>in stock</g:availability>
    <g:condition>new</g:condition>
    <g:price>${calculateEffectivePrice(item).toFixed(2)} ${CURRENCY}</g:price>
    <g:link>${SITE_URL}/es#menu</g:link>
    <g:image_link>${escapeXml(item.image)}</g:image_link>
    <g:brand>${BRAND}</g:brand>
    <g:product_type>${categoryName}</g:product_type>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>${BRAND} - Catalogo de Productos</title>
  <link href="${SITE_URL}" rel="alternate" />
  <updated>${new Date().toISOString()}</updated>
${entries}
</feed>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
