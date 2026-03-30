"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const BOT_AVATAR = "https://igwu4bqzucdjjkup.public.blob.vercel-storage.com/Public/botsitocunpollo.png";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center bg-white">
      {/* Mascot */}
      <motion.img
        src={BOT_AVATAR}
        alt="CunPollo"
        className="w-48 h-48 sm:w-56 sm:h-56 object-contain drop-shadow-lg mb-2"
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.6, type: "spring" }}
      />

      {/* 404 */}
      <motion.h1
        className="text-7xl sm:text-8xl font-black text-red-600 mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        404
      </motion.h1>

      {/* Message */}
      <motion.p
        className="text-lg sm:text-xl text-gray-700 font-medium mb-2 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {t("title")}
      </motion.p>
      <motion.p
        className="text-sm text-gray-400 mb-8 max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {t("subtitle")}
      </motion.p>

      {/* CTAs */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Link
          href="/menu"
          className="bg-red-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors shadow-lg"
        >
          {t("ctaMenu")}
        </Link>
        <Link
          href="/"
          className="bg-white text-red-600 px-8 py-3 rounded-full font-semibold border-2 border-red-600 hover:bg-red-50 transition-colors"
        >
          {t("ctaHome")}
        </Link>
      </motion.div>
    </div>
  );
}
