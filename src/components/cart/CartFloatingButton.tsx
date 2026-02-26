"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { Link } from "@/i18n/navigation";
import { FEATURES } from "@/lib/constants";

export default function CartFloatingButton() {
  const { itemCount } = useCart();

  if (!FEATURES.ORDERING_ENABLED || itemCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Link
          href="/cart"
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-red-700 transition-colors font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
          <motion.span
            key={itemCount}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
          >
            {itemCount}
          </motion.span>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
