"use client";

import type { UIMessage } from "ai";
import ChatProductCard from "./ChatProductCard";

type ProductItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  effectivePrice: number;
  hasDiscount: boolean;
  image: string;
  isPromo: boolean;
};

type CartAction = {
  action: string;
  menuItemId: string;
  quantity?: number;
  itemName: string;
};

type ChatMessageProps = {
  message: UIMessage;
  onAddToCart: (menuItemId: string, quantity: number) => void;
};

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ));
  });
}

export default function ChatMessage({ message, onAddToCart }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Extract text, products, and cart actions from parts
  const textParts: string[] = [];
  const products: ProductItem[] = [];
  const actions: CartAction[] = [];

  for (const part of message.parts) {
    if (part.type === "text" && part.text) {
      textParts.push(part.text);
    } else if (part.type?.startsWith("tool-")) {
      const toolPart = part as { type: string; state: string; output?: unknown };
      if (toolPart.state !== "output-available") continue;
      const output = toolPart.output as Record<string, unknown> | undefined;
      if (!output) continue;

      // search_menu results
      if (part.type === "tool-search_menu" && Array.isArray(output.items)) {
        products.push(...(output.items as ProductItem[]));
      }
      // Cart actions
      if (output.action === "addToCart" || output.action === "removeFromCart") {
        actions.push(output as unknown as CartAction);
      }
    }
  }

  const text = textParts.join("");

  // Don't render empty assistant messages
  if (!isUser && !text && products.length === 0 && actions.length === 0) {
    return null;
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? "bg-red-600 text-white rounded-2xl rounded-br-md px-4 py-2"
            : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md px-4 py-2"
        }`}
      >
        {text && (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderText(text)}
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-2 space-y-2">
            {products.slice(0, 5).map((product) => (
              <ChatProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}

        {actions.map((action, i) => (
          <div
            key={i}
            className="mt-2 text-xs bg-green-50 text-green-700 rounded-lg px-3 py-1.5 border border-green-200"
          >
            {action.action === "addToCart"
              ? `+ ${action.quantity || 1}x ${action.itemName}`
              : `- ${action.itemName}`}
          </div>
        ))}
      </div>
    </div>
  );
}
