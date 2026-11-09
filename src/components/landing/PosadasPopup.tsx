"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "cunpollo-posadas-popup";
const SNOOZE_DAYS = 3;
const SHOW_DELAY_MS = 2200;
const IMAGE_URL =
  "https://igwu4bqzucdjjkup.public.blob.vercel-storage.com/whatsapp/posadas-2026.jpeg";
const GERENCIA_PHONE = "+529984283677";

const LIGHT_COLORS = ["#F5B731", "#E83535", "#FACA5A", "#F05C5C"];

export default function PosadasPopup() {
  const t = useTranslations("posadas");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last && Date.now() - Number(last) < SNOOZE_DAYS * 86_400_000) return;
    } catch {
      // storage unavailable — show anyway
    }
    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const waUrl = `https://wa.me/${GERENCIA_PHONE.replace("+", "")}?text=${encodeURIComponent(t("waMessage"))}`;

  const packages = [
    { name: t("p1name"), detail: t("p1detail"), price: "$600" },
    { name: t("p2name"), detail: t("p2detail"), price: "$400" },
    { name: t("p3name"), detail: t("p3detail"), price: "$290" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-6"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
        >
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-surface-2 border-t sm:border border-gold-500/20 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/70"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen posadas */}
            <div className="relative aspect-[1200/628]">
              <Image
                src={IMAGE_URL}
                alt={t("title")}
                fill
                sizes="(max-width: 640px) 100vw, 448px"
                className="object-cover"
                priority
              />
              {/* Fusión con la card */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-2 to-transparent" />
              {/* Luces de posada */}
              <div className="absolute top-2.5 inset-x-0 flex justify-center gap-4" aria-hidden>
                {LIGHT_COLORS.concat(LIGHT_COLORS).map((color, i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>

            {/* Cerrar */}
            <button
              onClick={close}
              aria-label={t("close")}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur text-white/80 hover:text-white hover:bg-black/70 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <div className="px-5 sm:px-7 pb-6 sm:pb-7 -mt-2 relative">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-gold-400 text-[11px] font-semibold tracking-[0.3em] uppercase mb-1.5"
              >
                {t("kicker")}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="text-2xl sm:text-[1.7rem] font-bold text-ink mb-4 font-(family-name:--font-heading)"
              >
                {t("title")}
              </motion.h2>

              <motion.ul
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-4"
              >
                {packages.map((p) => (
                  <li
                    key={p.name}
                    className="flex items-baseline justify-between gap-3 py-2.5 border-b border-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-ink/50">{p.detail}</p>
                    </div>
                    <span className="text-lg font-bold text-gold-400 shrink-0">{p.price}</span>
                  </li>
                ))}
                <li className="flex items-baseline justify-between gap-3 py-2.5">
                  <p className="text-sm font-semibold text-ink">{t("barName")}</p>
                  <span className="text-lg font-bold text-gold-400 shrink-0">$200</span>
                </li>
              </motion.ul>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="flex flex-col gap-2.5"
              >
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 text-white font-semibold rounded-full shadow-lg shadow-red-600/25 hover:bg-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 2a10 10 0 0 0-8.65 15.01L2 22l5.13-1.33A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.04.79.81-2.96-.2-.31A8.2 8.2 0 1 1 12 20.2Zm4.5-6.14c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.45-1.37-1.7-.14-.24-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.12.16 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.47-.28Z" />
                  </svg>
                  {t("whatsapp")}
                </a>
                <a
                  href={`tel:${GERENCIA_PHONE}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/15 text-ink/80 font-semibold rounded-full hover:bg-white/5 transition-colors text-sm"
                >
                  {t("call")}
                </a>
                <p className="text-[11px] text-ink/40 text-center mt-1">{t("fine")}</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
