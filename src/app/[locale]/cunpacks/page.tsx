import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import cunpacksImage from "../../../../public/images/cunpacks/cunpacks-vertical.webp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cunpacks" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: ["/images/cunpacks/cunpacks-vertical.webp"],
    },
  };
}

export default async function CunpacksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "cunpacks" });

  return (
    <div className="pt-22 sm:pt-24 md:pt-28 pb-12 sm:pb-16 px-4">
      <div className="mx-auto w-full max-w-md">
        <Image
          src={cunpacksImage}
          alt={t("alt")}
          priority
          sizes="(max-width: 480px) 100vw, 448px"
          className="w-full h-auto rounded-3xl shadow-2xl shadow-black/60"
        />

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/menu"
            className="inline-flex items-center justify-center px-8 py-4 bg-gold-500 text-dark font-bold text-lg rounded-full shadow-lg shadow-gold-500/30 hover:bg-gold-400 transition-colors"
          >
            {t("menu")}
          </Link>
          <p className="text-xs text-ink/40 text-center mt-1">{t("fine")}</p>
        </div>
      </div>
    </div>
  );
}
