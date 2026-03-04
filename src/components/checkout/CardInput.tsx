"use client";

import { useTranslations } from "next-intl";

type CardData = {
  number: string;
  expiry: string;
  cvv: string;
  holderName: string;
};

export default function CardInput({
  value,
  onChange,
}: {
  value: CardData;
  onChange: (data: CardData) => void;
}) {
  const t = useTranslations("checkout");

  const formatCardNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark/70 mb-1">{t("cardHolder")}</label>
        <input
          type="text"
          value={value.holderName}
          onChange={(e) => onChange({ ...value, holderName: e.target.value })}
          placeholder={t("cardHolderPlaceholder")}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark/70 mb-1">{t("cardNumber")}</label>
        <input
          type="text"
          inputMode="numeric"
          value={value.number}
          onChange={(e) => onChange({ ...value, number: formatCardNumber(e.target.value) })}
          placeholder={t("cardNumberPlaceholder")}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-mono"
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark/70 mb-1">{t("expiry")}</label>
          <input
            type="text"
            inputMode="numeric"
            value={value.expiry}
            onChange={(e) => onChange({ ...value, expiry: formatExpiry(e.target.value) })}
            placeholder={t("expiryPlaceholder")}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-mono"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark/70 mb-1">{t("cvv")}</label>
          <input
            type="text"
            inputMode="numeric"
            value={value.cvv}
            onChange={(e) => onChange({ ...value, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            placeholder={t("cvvPlaceholder")}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-mono"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
