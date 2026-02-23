"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: "es" | "en") => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center rounded-full border border-dark/10 overflow-hidden text-sm">
      <button
        onClick={() => switchLocale("es")}
        className={cn(
          "px-3 py-1 transition-colors cursor-pointer",
          locale === "es"
            ? "bg-gold-500 text-white"
            : "text-dark/60 hover:text-dark"
        )}
      >
        ES
      </button>
      <button
        onClick={() => switchLocale("en")}
        className={cn(
          "px-3 py-1 transition-colors cursor-pointer",
          locale === "en"
            ? "bg-gold-500 text-white"
            : "text-dark/60 hover:text-dark"
        )}
      >
        EN
      </button>
    </div>
  );
}
