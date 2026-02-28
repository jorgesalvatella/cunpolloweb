"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { getMenuItemById } from "@/data";
import CardInput from "./CardInput";
import type { Locale } from "@/i18n/config";

export default function CheckoutForm() {
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout");
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    holderName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deviceFingerprint, setDeviceFingerprint] = useState("");

  useEffect(() => {
    // Generate a device fingerprint for fraud prevention (T1 Pagos requirement).
    // TODO: Replace with CyberSource SDK when credentials are available.
    setDeviceFingerprint(crypto.randomUUID());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerName || !customerPhone || !card.number || !card.expiry || !card.cvv || !card.holderName) {
      setError(t("errorValidation"));
      return;
    }

    const [expMonth, expYear] = card.expiry.split("/");
    if (!expMonth || !expYear) {
      setError(t("errorCard"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
          customerName,
          customerPhone,
          card: {
            number: card.number.replace(/\s/g, ""),
            expMonth,
            expYear: expYear.length === 2 ? `20${expYear}` : expYear,
            cvv: card.cvv,
            holderName: card.holderName,
          },
          deviceFingerprint,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("errorGeneric"));
        setLoading(false);
        return;
      }

      clearCart();
      router.push(`/${locale}/confirmation/${data.orderId}`);
    } catch {
      setError(t("errorGeneric"));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Order Summary */}
      <div>
        <h2 className="text-lg font-bold text-dark mb-3">{t("orderSummary")}</h2>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          {items.map((item) => {
            const menuItem = getMenuItemById(item.menuItemId);
            if (!menuItem) return null;
            return (
              <div key={item.menuItemId} className="flex justify-between text-sm">
                <span>
                  {menuItem.name[locale]} x{item.quantity}
                </span>
                <span className="font-medium">${menuItem.price * item.quantity}</span>
              </div>
            );
          })}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
            <span>{t("orderSummary")}</span>
            <span className="text-red-700">${total} MXN</span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div>
        <h2 className="text-lg font-bold text-dark mb-3">{t("customerInfo")}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark/70 mb-1">{t("name")}</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark/70 mb-1">{t("phone")}</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              required
            />
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div>
        <h2 className="text-lg font-bold text-dark mb-3">{t("paymentInfo")}</h2>
        <CardInput value={card} onChange={setCard} />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? t("processing") : `${t("pay")} $${total} MXN`}
      </button>
    </form>
  );
}
