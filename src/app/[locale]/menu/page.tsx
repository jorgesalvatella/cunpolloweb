import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Container from "@/components/ui/Container";
import MenuContainer from "@/components/menu/MenuContainer";
import { MenuJsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menu" });
  return {
    title: t("title"),
    description: t("pageSubtitle"),
  };
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "menu" });

  return (
    <>
      <MenuJsonLd />
      <div className="pt-22 sm:pt-24 md:pt-28 pb-12 sm:pb-16">
        <Container>
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-600 mb-2 sm:mb-3 font-(family-name:--font-heading)">
              {t("pageTitle")}
            </h1>
            <p className="text-base sm:text-lg text-dark/60">{t("pageSubtitle")}</p>
          </div>
          <MenuContainer />
        </Container>
      </div>
    </>
  );
}
