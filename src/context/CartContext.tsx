"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CartItem } from "@/types/order";

type CartContextType = {
  items: CartItem[];
  addItem: (menuItemId: string, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0,
  itemCount: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  // Phase 3: Replace with actual state management
  const value: CartContextType = {
    items: [],
    addItem: () => {},
    removeItem: () => {},
    updateQuantity: () => {},
    clearCart: () => {},
    total: 0,
    itemCount: 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
