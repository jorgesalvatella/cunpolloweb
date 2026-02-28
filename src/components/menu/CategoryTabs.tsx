"use client";

import { useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/types/menu";
import type { Locale } from "@/i18n/config";

export default function CategoryTabs({
  categories,
  activeId,
  allLabel,
  onSelect,
}: {
  categories: MenuCategory[];
  activeId: string | null;
  allLabel: string;
  onSelect: (id: string | null) => void;
}) {
  const locale = useLocale() as Locale;
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeId]);

  const tabs = [
    { id: null, label: allLabel, icon: "🍽️" },
    ...categories.map((c) => ({
      id: c.id,
      label: c.name[locale],
      icon: c.icon,
    })),
  ];

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id ?? "all"}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap text-sm font-medium transition-colors cursor-pointer shrink-0",
              isActive
                ? "text-white"
                : "text-dark/60 hover:text-dark bg-dark/5 hover:bg-dark/10"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gold-500 rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
