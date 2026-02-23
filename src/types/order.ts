// Phase 3 preparation - Order types

export type CartItem = {
  menuItemId: string;
  quantity: number;
  notes?: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  items: CartItem[];
  status: OrderStatus;
  total: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
};
