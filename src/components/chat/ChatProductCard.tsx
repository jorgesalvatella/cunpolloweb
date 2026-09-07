"use client";

import { useTranslations } from "next-intl";

type ProductData = {
  id: string;
  name: string;
  description?: string;
  price: number;
  effectivePrice: number;
  hasDiscount: boolean;
  image: string;
  isPromo: boolean;
};

type ChatProductCardProps = {
  product: ProductData;
  onAddToCart: (menuItemId: string, quantity: number) => void;
};

export default function ChatProductCard({
  product,
  onAddToCart,
}: ChatProductCardProps) {
  const t = useTranslations("chat");

  return (
    <div className="flex gap-3 p-2 rounded-xl">
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 shadow-lg shadow-black/50"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">
          {product.name}
        </p>
        {product.description && (
          <p className="text-xs text-white/50 truncate">{product.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {product.hasDiscount ? (
            <>
              <span className="text-sm font-bold text-red-300">
                ${product.effectivePrice}
              </span>
              <span className="text-xs text-white/30 line-through">
                ${product.price}
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-gold-400">
              ${product.price}
            </span>
          )}
        </div>
        {!product.isPromo && (
          <button
            onClick={() => onAddToCart(product.id, 1)}
            className="mt-1 text-xs font-medium text-white bg-red-600 rounded-full px-3 py-1 hover:bg-red-500 transition-colors"
          >
            + {t("addToCart")}
          </button>
        )}
        {product.isPromo && (
          <span className="mt-1 inline-block text-xs text-amber-300 font-medium">
            {t("inStoreOnly")}
          </span>
        )}
      </div>
    </div>
  );
}
