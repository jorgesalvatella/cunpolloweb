"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import CheckoutForm from "@/components/checkout/CheckoutForm";

function ProgressSteps({ current }: { current: number }) {
  const t = useTranslations("checkout");
  const steps = [
    { label: t("stepMenu"), num: 1 },
    { label: t("stepCart"), num: 2 },
    { label: t("stepPayment"), num: 3 },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step.num <= current
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 text-dark/40"
              }`}
            >
              {step.num}
            </span>
            <span
              className={`text-sm font-medium ${
                step.num <= current ? "text-dark" : "text-dark/40"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                step.num < current ? "bg-red-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const { items } = useCart();

  return (
    <section className="pt-28 pb-16 min-h-screen bg-white">
      <Container>
        <div className="max-w-lg mx-auto">
          <ProgressSteps current={3} />

          <h1 className="text-3xl font-bold text-red-700 font-(family-name:--font-heading) mb-8">
            {t("title")}
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-dark/50 text-lg mb-6">{t("emptyCart")}</p>
              <Link
                href="/cart"
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors"
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
