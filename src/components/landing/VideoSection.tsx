"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";

export default function VideoSection() {
  const t = useTranslations("video");

  return (
    <section className="py-10 sm:py-14 bg-warm-white">
      <Container>
        <div className="text-center mb-6 sm:mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-2 sm:mb-3 font-(family-name:--font-heading)"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-dark/60"
          >
            {t("subtitle")}
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            controls
            className="w-full rounded-xl sm:rounded-2xl shadow-lg"
          >
            <source src="/cunpollovideo.mp4" type="video/mp4" />
          </video>
        </motion.div>
      </Container>
    </section>
  );
}
