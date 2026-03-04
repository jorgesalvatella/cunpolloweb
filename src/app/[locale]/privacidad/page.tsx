import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Container from "@/components/ui/Container";
import { RESTAURANT } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("privacyTitle"),
  };
}

export default async function PrivacidadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <div className="pt-22 sm:pt-24 md:pt-28 pb-12 sm:pb-16">
      <Container className="max-w-4xl">
        <h1 className="text-3xl font-bold text-dark mb-2">{t("privacyTitle")}</h1>
        <p className="text-sm text-dark/50 mb-8">{t("lastUpdated")}: 4 de marzo de 2026</p>

        <div className="prose prose-sm max-w-none text-dark/80 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-dark">{t("privacy.responsibleTitle")}</h2>
            <p>{t("privacy.responsibleText")}</p>
            <p>
              {RESTAURANT.name}<br />
              {RESTAURANT.address.street}, {RESTAURANT.address.city}, {RESTAURANT.address.state} {RESTAURANT.address.zip}<br />
              {RESTAURANT.phone}<br />
              {RESTAURANT.email}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("privacy.dataCollectedTitle")}</h2>
            <p>{t("privacy.dataCollectedText")}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t("privacy.data1")}</li>
              <li>{t("privacy.data2")}</li>
              <li>{t("privacy.data3")}</li>
              <li>{t("privacy.data4")}</li>
            </ul>
            <p className="font-semibold mt-2">{t("privacy.dataCardNote")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("privacy.purposeTitle")}</h2>
            <p>{t("privacy.purposeText")}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t("privacy.purpose1")}</li>
              <li>{t("privacy.purpose2")}</li>
              <li>{t("privacy.purpose3")}</li>
              <li>{t("privacy.purpose4")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("privacy.transferTitle")}</h2>
            <p>{t("privacy.transferText")}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t("privacy.transfer1")}</li>
              <li>{t("privacy.transfer2")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("privacy.arcoTitle")}</h2>
            <p>{t("privacy.arcoText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("privacy.cookiesTitle")}</h2>
            <p>{t("privacy.cookiesText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("privacy.securityTitle")}</h2>
            <p>{t("privacy.securityText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("privacy.changesTitle")}</h2>
            <p>{t("privacy.changesText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("privacy.authorityTitle")}</h2>
            <p>{t("privacy.authorityText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("privacy.consentTitle")}</h2>
            <p>{t("privacy.consentText")}</p>
          </section>
        </div>
      </Container>
    </div>
  );
}
