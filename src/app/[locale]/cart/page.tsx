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
            <span className="text-6xl block mb-4">🛒</span>
            <p className="text-dark/50 text-lg mb-6">{t("empty")}</p>
            <Link
              href="/menu"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
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

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/checkout"
                className="flex-1 text-center bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                {t("checkout")}
              </Link>
              <Link
                href="/menu"
                className="flex-1 text-center bg-gray-100 text-dark px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                {t("continueShopping")}
              </Link>
              <button
                onClick={clearCart}
                className="text-red-400 hover:text-red-600 transition-colors text-sm cursor-pointer py-2"
              >
                {t("clearCart")}
              </button>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
