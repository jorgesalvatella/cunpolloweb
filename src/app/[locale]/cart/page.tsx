"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import CartItemRow from "@/components/cart/CartItemRow";

export default function CartPage() {
  const t = useTranslations("cart");
  const { items, total, clearCart } = useCart();

  return (
    <section className="pt-28 pb-16 min-h-screen bg-white">
      <Container>
        <h1 className="text-3xl font-bold text-red-700 font-(family-name:--font-heading) mb-8">
          {t("title")}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto mb-4 text-dark/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <p className="text-dark/50 text-lg mb-6">{t("empty")}</p>
            <Link
              href="/menu"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors"
            >
              {t("goToMenu")}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              {items.map((item) => (
                <CartItemRow key={item.menuItemId} item={item} />
              ))}
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center text-lg mb-2">
                <span className="text-dark/70">{t("subtotal")}</span>
                <span className="font-semibold">${total}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold border-t border-gray-200 pt-3">
                <span>{t("total")}</span>
                <span className="text-red-700">${total} MXN</span>
              </div>
            </div>

            <p className="text-center text-dark/50 text-sm mb-4">
              {t("pickupEstimate")}
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/checkout"
                className="text-center bg-red-600 text-white px-6 py-4 rounded-full font-bold text-lg hover:bg-red-700 transition-colors"
              >
                {t("checkout")}
              </Link>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/menu"
                  className="text-red-600 font-medium hover:text-red-700 transition-colors text-sm"
                >
                  {t("continueShopping")}
                </Link>
                <span className="text-dark/20">|</span>
                <button
                  onClick={clearCart}
                  className="text-red-400 hover:text-red-600 transition-colors text-sm cursor-pointer"
                >
                  {t("clearCart")}
                </button>
              </div>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
