export type CartItem = {
  menuItemId: string;
  quantity: number;
  notes?: string;
};

export type OrderItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "ready"
  | "picked_up"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed";

export type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  payment_reference: string | null;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
};

export type CreateOrderRequest = {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  tokenId: string;
  deviceSessionId: string;
};

export type CreateOrderResponse = {
  orderId: string;
  orderNumber: number;
};
