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
  | "failed"
  | "refunded";

export type OrderType = "dine_in" | "pickup";

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
  order_type: OrderType;
  pickup_time: string | null;
  guests: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateOrderRequest = {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  tokenId: string;
  deviceSessionId: string;
  orderType: OrderType;
  pickupTime: string | null;
  guests: number | null;
  idempotencyKey?: string;
};

export type CreateOrderResponse = {
  orderId: string;
  orderNumber: number;
};
