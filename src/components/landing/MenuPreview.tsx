"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import { getFeaturedItems } from "@/data";
import type { Locale } from "@/i18n/config";
import type { MenuItemTag } from "@/types/menu";

export default function MenuPreview() {
  const t = useTranslations("menuPreview");
  const tMenu = useTranslations("menu");
  const locale = useLocale() as Locale;
  const featured = getFeaturedItems();

  const tagLabels: Record<MenuItemTag, string> = {
    popular: tMenu("popular"),
    spicy: tMenu("spicy"),
    new: tMenu("new"),
  };

  return (
    <section className="py-14 sm:py-20 bg-red-50">
      <Container>
        <div className="text-center mb-8 sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-600 mb-3 sm:mb-4 font-(family-name:--font-heading)"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-dark/60"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {featured.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="h-32 sm:h-48 bg-red-50 relative overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name[locale]}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              </div>
              <div className="p-3 sm:p-5">
                <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <h3 className="font-semibold text-dark text-xs sm:text-base leading-tight">
                    {item.name[locale]}
                  </h3>
                  <span className="text-gold-500 font-bold whitespace-nowrap text-xs sm:text-base">
                    ${item.price}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-dark/50 mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
                  {item.description[locale]}
                </p>
                {item.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.map((tag) => (
                      <Badge key={tag} tag={tag} label={tagLabels[tag]} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8 sm:mt-10"
        >
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all shadow-md hover:shadow-lg text-base sm:text-lg"
          >
            {t("viewAll")}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
