"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const { items } = useCart();

  return (
    <section className="pt-28 pb-16 min-h-screen bg-white">
      <Container>
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold text-red-700 font-(family-name:--font-heading) mb-8">
            {t("title")}
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-dark/50 text-lg mb-6">{t("emptyCart")}</p>
              <Link
                href="/cart"
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                {t("backToCart")}
              </Link>
            </div>
          ) : (
            <CheckoutForm />
          )}
        </div>
      </Container>
    </section>
  );
}
