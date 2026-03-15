"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Script from "next/script";
import { useCart } from "@/context/CartContext";
import { getMenuItemById } from "@/data";
import CardInput from "./CardInput";
import type { Locale } from "@/i18n/config";
import type { OrderType } from "@/types/order";

const ALL_TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 13; h <= 21; h++) {
    slots.push(`${h}:00`);
    if (h < 21) {
      slots.push(`${h}:15`);
      slots.push(`${h}:30`);
      slots.push(`${h}:45`);
    }
  }
  return slots;
})();

function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + m;
}

function getAvailableSlots(): string[] {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Cancun",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const nowH = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const nowM = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const nowMinutes = nowH * 60 + nowM + 30;

  const filtered = ALL_TIME_SLOTS.filter((slot) => slotToMinutes(slot) >= nowMinutes);
  return filtered.length > 0 ? filtered : ALL_TIME_SLOTS;
}

declare global {
  interface Window {
    OpenPay: {
      setId: (id: string) => void;
      setApiKey: (key: string) => void;
      setSandboxMode: (sandbox: boolean) => void;
      deviceData: {
        setup: (formId?: string, fieldName?: string) => string;
      };
      token: {
        create: (
          data: {
            card_number: string;
            holder_name: string;
            expiration_year: string;
            expiration_month: string;
            cvv2: string;
          },
          onSuccess: (response: { data: { id: string } }) => void,
          onError: (error: { data: { description: string; error_code: number } }) => void
        ) => void;
      };
      card: {
        validateCardNumber: (number: string) => boolean;
        validateCVC: (cvc: string) => boolean;
        validateExpiry: (month: string, year: string) => boolean;
        cardType: (number: string) => string;
      };
    };
  }
}

export default function CheckoutForm() {
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout");
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [pickupTime, setPickupTime] = useState("");
  const [guests, setGuests] = useState<number | null>(null);
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", holderName: "" });
  const [availableSlots, setAvailableSlots] = useState<string[]>(ALL_TIME_SLOTS);

  useEffect(() => {
    setAvailableSlots(getAvailableSlots());
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const [openpayReady, setOpenpayReady] = useState(false);
  const [deviceSessionId, setDeviceSessionId] = useState("");
  const [mainScriptLoaded, setMainScriptLoaded] = useState(false);
  const [dataScriptLoaded, setDataScriptLoaded] = useState(false);

  const initOpenPay = useCallback(() => {
    if (typeof window === "undefined" || !window.OpenPay) return;

    const tryInit = (attempt: number) => {
      if (window.OpenPay.deviceData) {
        const merchantId = process.env.NEXT_PUBLIC_OPENPAY_MERCHANT_ID!;
        const apiKey = process.env.NEXT_PUBLIC_OPENPAY_PUBLIC_KEY!;
        const sandbox = process.env.NEXT_PUBLIC_OPENPAY_SANDBOX === "true";
        window.OpenPay.setId(merchantId);
        window.OpenPay.setApiKey(apiKey);
        window.OpenPay.setSandboxMode(sandbox);
        const sessionId = window.OpenPay.deviceData.setup();
        setDeviceSessionId(sessionId);
        setOpenpayReady(true);
      } else if (attempt < 10) {
        setTimeout(() => tryInit(attempt + 1), 300);
      }
    };
    tryInit(0);
  }, []);

  useEffect(() => {
    if (mainScriptLoaded && dataScriptLoaded) {
      initOpenPay();
    }
  }, [mainScriptLoaded, dataScriptLoaded, initOpenPay]);

  const tokenizeCard = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const digits = card.number.replace(/\s/g, "");
      const [month, year] = card.expiry.split("/");

      const timeout = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado al tokenizar la tarjeta"));
      }, 15000);

      try {
        const tokenData = {
            card_number: digits,
            holder_name: card.holderName,
            expiration_month: month,
            expiration_year: year,
            cvv2: card.cvv,
        };
        window.OpenPay.token.create(
          tokenData,
          (response) => {
            clearTimeout(timeout);
            resolve(response.data.id);
          },
          (error: { data: { description: string; error_code: number }; status?: number; message?: string }) => {
            clearTimeout(timeout);
            const desc = error?.data?.description || error?.message || "Error al procesar la tarjeta";
            reject(new Error(desc));
          }
        );
      } catch (err) {
        clearTimeout(timeout);
        reject(err instanceof Error ? err : new Error("Error al tokenizar tarjeta"));
      }
    });
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerName || !customerPhone) {
      showError(t("errorValidation"));
      return;
    }

    if (!pickupTime) {
      showError(t("errorPickupTime"));
      return;
    }

    if (orderType === "dine_in" && !guests) {
      showError(t("errorGuests"));
      return;
    }

    const digits = card.number.replace(/\s/g, "");
    if (!digits || !card.expiry || !card.cvv || !card.holderName) {
      showError(t("errorCard"));
      return;
    }

    if (!openpayReady) {
      showError("El sistema de pago no esta listo. Intenta de nuevo.");
      return;
    }

    setLoading(true);

    try {
      const tokenId = await tokenizeCard();

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
          customerName,
          customerPhone,
          tokenId,
          deviceSessionId,
          orderType,
          pickupTime,
          guests: orderType === "dine_in" ? guests : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || t("errorGeneric"));
        setLoading(false);
        return;
      }

      // 3D Secure redirect
      if (data.redirectUrl) {
        clearCart();
        window.location.href = data.redirectUrl;
        return;
      }

      clearCart();
      router.push(`/${locale}/confirmation/${data.orderId}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : t("errorGeneric"));
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://resources.openpay.mx/lib/openpay-js/1.2.38/openpay.v1.min.js"
        strategy="afterInteractive"
        onLoad={() => setMainScriptLoaded(true)}
      />
      {mainScriptLoaded && (
        <Script
          src="https://resources.openpay.mx/lib/openpay-data-js/1.2.38/openpay-data.v1.min.js"
          strategy="afterInteractive"
          onLoad={() => setDataScriptLoaded(true)}
        />
      )}

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
              />
            </div>
          </div>
        </div>

        {/* Order Type */}
        <div>
          <h2 className="text-lg font-bold text-dark mb-3">{t("orderType")}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setOrderType("dine_in")}
              className={`py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer border-2 ${
                orderType === "dine_in"
                  ? "border-red-600 bg-red-50 text-red-700"
                  : "border-gray-200 bg-white text-dark/70 hover:border-gray-300"
              }`}
            >
              {t("dineIn")}
            </button>
            <button
              type="button"
              onClick={() => setOrderType("pickup")}
              className={`py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer border-2 ${
                orderType === "pickup"
                  ? "border-red-600 bg-red-50 text-red-700"
                  : "border-gray-200 bg-white text-dark/70 hover:border-gray-300"
              }`}
            >
              {t("pickup")}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark/70 mb-1">{t("pickupTime")}</label>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white text-dark"
            >
              <option value="">{t("selectTime")}</option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
          {orderType === "dine_in" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-dark/70 mb-1">{t("guests")}</label>
              <select
                value={guests ?? ""}
                onChange={(e) => setGuests(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white text-dark"
              >
                <option value="">{t("selectGuests")}</option>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Payment Info */}
        <div>
          <h2 className="text-lg font-bold text-dark mb-3">{t("paymentInfo")}</h2>
          <CardInput value={card} onChange={setCard} />
        </div>

        {error && (
          <div ref={errorRef} className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !openpayReady}
          className="w-full bg-red-600 text-white py-4 rounded-full font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t("processing")}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {`${t("pay")} $${total} MXN`}
            </span>
          )}
        </button>

        {/* Security Trust Section */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-dark/70">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {t("securePayment")}
          </div>

          <div className="flex items-center justify-center gap-3">
            {/* Visa */}
            <svg className="h-8" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="780" height="500" rx="40" fill="#1A1F71"/>
              <path d="M293.2 348.7l33.4-195.7h53.4l-33.4 195.7H293.2zm224.1-190.8c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.2 64.7-.3 28.2 26.5 43.9 46.8 53.3 20.8 9.6 27.8 15.8 27.7 24.4-.1 13.2-16.6 19.2-32 19.2-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.1 0 92.5-26.3 92.9-67 .2-22.3-14-39.3-44.8-53.3-18.6-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.5 40 7.5l4.8 2.3 7.2-42.7zm138.3-4.9h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.4 179.5h56.1l11.2-29.3h68.5l6.5 29.3h49.5l-43.1-195.8zm-65.9 126.3c4.4-11.3 21.5-54.7 21.5-54.7-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47.2 12.5 57.1h-44.7v-.6zM248.7 153l-52.3 133.6-5.6-27.1c-9.7-31.2-39.9-65-73.7-81.9l47.8 171h56.5l84.1-195.7h-56.8v.1z" fill="white"/>
              <path d="M146.9 153H60.1l-.7 4.1c67 16.2 111.4 55.3 129.8 102.3L171.2 170c-3.2-12.4-12.7-16.4-24.3-17z" fill="#F9A533"/>
            </svg>
            {/* Mastercard */}
            <svg className="h-8" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="780" height="500" rx="40" fill="#252525"/>
              <circle cx="330" cy="250" r="140" fill="#EB001B"/>
              <circle cx="450" cy="250" r="140" fill="#F79E1B"/>
              <path d="M390 147.5c32.5 26.3 53.3 66.3 53.3 111.5s-20.8 85.2-53.3 111.5c-32.5-26.3-53.3-66.3-53.3-111.5s20.8-85.2 53.3-111.5z" fill="#FF5F00"/>
            </svg>
            {/* Amex */}
            <svg className="h-8" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="780" height="500" rx="40" fill="#2E77BC"/>
              <path d="M40 221h42.6l9.5-21.5 9.6 21.5h166.5v-16.4l14.8 16.4h85.8V165H327v-1l.8-1.3H411l14 15.4L440 163h42v-.5h.5" fill="none"/>
              <text x="390" y="280" textAnchor="middle" fill="white" fontSize="120" fontFamily="Arial, sans-serif" fontWeight="bold">AMEX</text>
            </svg>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-dark/40">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              SSL 256-bit
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t("securePayment")}
            </span>
          </div>
        </div>
      </form>
    </>
  );
}
