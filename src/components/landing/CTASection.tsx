"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import { RESTAURANT } from "@/lib/constants";

export default function CTASection() {
  const t = useTranslations("cta");

  return (
    <section className="py-14 sm:py-20 bg-red-500 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-40 sm:w-80 h-40 sm:h-80 bg-white/10 rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-32 sm:w-60 h-32 sm:h-60 bg-white/10 rounded-full" />

      <Container className="relative z-10">
        <div className="text-center max-w-2xl mx-auto px-2">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 font-(family-name:--font-heading)"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-xl text-white/80 mb-8 sm:mb-10"
          >
            {t("subtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <Link
              href="/menu"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-red-600 font-semibold rounded-lg text-base sm:text-lg hover:bg-white/90 transition-all shadow-lg"
            >
              {t("button")}
            </Link>
            <a
              href={`tel:${RESTAURANT.phone}`}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 border-2 border-white text-white font-semibold rounded-lg text-base sm:text-lg hover:bg-white/10 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {t("phone")}
            </a>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
