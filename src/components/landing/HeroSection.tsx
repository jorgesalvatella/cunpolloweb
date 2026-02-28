"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import { FEATURES } from "@/lib/constants";

export default function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative min-h-[100svh] flex items-center bg-red-600 overflow-hidden">
      {/* Content */}
      <Container className="relative z-10 pt-28 pb-20 sm:py-32">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Text */}
          <div className="max-w-2xl lg:flex-1">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              className="mb-5 sm:mb-7"
            >
              <div className="inline-flex items-center gap-3 sm:gap-4 bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-[0_0_30px_rgba(255,215,0,0.25)]">
                {/* Playground icon */}
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gold-500 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m-7-7H4m16 0h1M7.05 7.05l-.7-.7m12.02 12.02l-.7-.7M7.05 16.95l-.7.7M18.36 5.64l-.7.7" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-white/80 font-semibold text-xs sm:text-sm uppercase tracking-wider">
                    {t("playArea")}
                  </span>
                  <span className="text-gold-400 font-extrabold text-base sm:text-xl md:text-2xl font-(family-name:--font-heading)">
                    {t("playAreaHighlight")}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-[0.95] mb-4 sm:mb-6 font-(family-name:--font-heading)"
            >
              {t("title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-10 max-w-lg"
            >
              {t("subtitle")}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Link
                href="/menu"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-4 bg-white text-red-600 font-bold rounded-full text-lg hover:bg-gold-300 hover:text-red-700 transition-all shadow-lg hover:shadow-xl"
              >
                {FEATURES.ORDERING_ENABLED ? t("ctaOrder") : t("cta")}
              </Link>
              <a
                href="#location"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 border-2 border-white text-white font-semibold rounded-full text-base sm:text-lg hover:bg-white hover:text-red-600 transition-all"
              >
                {t("ctaSecondary")}
              </a>
            </motion.div>
            {FEATURES.ORDERING_ENABLED && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-4 text-white/70 text-sm sm:text-base"
              >
                {t("trustLine")}
              </motion.p>
            )}
          </div>

          {/* Mascot Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:flex-1 flex justify-center"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-48 sm:w-64 md:w-72 lg:w-96 h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
            >
              <source src="/images/mascot-animation.mp4" type="video/mp4" />
            </video>
          </motion.div>
        </div>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
