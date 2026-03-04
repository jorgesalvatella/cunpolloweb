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
    title: t("termsTitle"),
  };
}

export default async function TerminosPage({
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
        <h1 className="text-3xl font-bold text-dark mb-2">{t("termsTitle")}</h1>
        <p className="text-sm text-dark/50 mb-8">{t("lastUpdated")}: 4 de marzo de 2026</p>

        <div className="prose prose-sm max-w-none text-dark/80 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-dark">{t("terms.generalTitle")}</h2>
            <p>{t("terms.generalText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("terms.serviceTitle")}</h2>
            <p>{t("terms.serviceText")}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t("terms.service1")}</li>
              <li>{t("terms.service2")}</li>
              <li>{t("terms.service3")}</li>
              <li>{t("terms.service4")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("terms.ordersTitle")}</h2>
            <p>{t("terms.ordersText")}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t("terms.orders1")}</li>
              <li>{t("terms.orders2")}</li>
              <li>{t("terms.orders3")}</li>
              <li>{t("terms.orders4")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("terms.paymentsTitle")}</h2>
            <p>{t("terms.paymentsText")}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t("terms.payments1")}</li>
              <li>{t("terms.payments2")}</li>
              <li>{t("terms.payments3")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("terms.cancellationsTitle")}</h2>
            <p>{t("terms.cancellationsText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("terms.liabilityTitle")}</h2>
            <p>{t("terms.liabilityText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("terms.ipTitle")}</h2>
            <p>{t("terms.ipText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("terms.modificationsTitle")}</h2>
            <p>{t("terms.modificationsText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("terms.jurisdictionTitle")}</h2>
            <p>{t("terms.jurisdictionText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark">{t("terms.contactTitle")}</h2>
            <p>
              {RESTAURANT.name}<br />
              {RESTAURANT.address.street}, {RESTAURANT.address.city}, {RESTAURANT.address.state} {RESTAURANT.address.zip}<br />
              {RESTAURANT.phone}<br />
              {RESTAURANT.email}
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
