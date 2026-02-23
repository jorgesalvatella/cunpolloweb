import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://cunpollo.com";

  const routes = ["", "/menu"];

  return routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    }))
  );
}
