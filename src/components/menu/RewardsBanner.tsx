"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FEATURES, REWARDS_URL } from "@/lib/constants";

export default function RewardsBanner() {
  const t = useTranslations("rewards");
  const [dismissed, setDismissed] = useState(false);

  if (!FEATURES.REWARDS_ENABLED || dismissed) return null;

  return (
    <div className="bg-gold-500 rounded-xl px-4 py-3 flex items-center justify-between gap-3 mb-4 shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <p className="text-white font-bold text-sm">{t("menuBanner")}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={REWARDS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 bg-white text-gold-600 text-sm font-bold rounded-full hover:bg-white/90 transition-colors shadow-sm"
        >
          {t("menuBannerCta")}
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
          className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
