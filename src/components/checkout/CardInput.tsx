"use client";

import { useTranslations } from "next-intl";

type CardData = {
  number: string;
  expiry: string;
  cvv: string;
  holderName: string;
};

function validateLuhn(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function validateExpiry(expiry: string): boolean {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
  const [monthStr, yearStr] = expiry.split("/");
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10) + 2000;
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expDate = new Date(year, month); // first day of next month
  return expDate > now;
}

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

  const cardDigits = value.number.replace(/\s/g, "");
  const showCardError = cardDigits.length >= 13 && !validateLuhn(cardDigits);
  const showExpiryError = value.expiry.length === 5 && !validateExpiry(value.expiry);

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
          autoComplete="cc-name"
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
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-mono ${showCardError ? "border-red-400" : "border-gray-200"}`}
          autoComplete="cc-number"
        />
        {showCardError && (
          <p className="text-red-500 text-xs mt-1">{t("invalidCard")}</p>
        )}
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-mono ${showExpiryError ? "border-red-400" : "border-gray-200"}`}
            autoComplete="cc-exp"
          />
          {showExpiryError && (
            <p className="text-red-500 text-xs mt-1">{t("invalidExpiry")}</p>
          )}
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
            autoComplete="cc-csc"
          />
        </div>
      </div>
    </div>
  );
}
