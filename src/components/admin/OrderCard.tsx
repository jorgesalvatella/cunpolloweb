"use client";

import type { Order, OrderStatus } from "@/types/order";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  picked_up: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  ready: "Listo",
  picked_up: "Entregado",
  cancelled: "Cancelado",
};

function getLabel(order: Order): { label: string; color: string } {
  if (order.status === "pending") {
    if (order.payment_status === "pending_spei") return { label: "Esperando SPEI", color: "bg-indigo-100 text-indigo-800" };
    if (order.payment_status === "pending_3ds") return { label: "Esperando pago 3DS", color: "bg-amber-100 text-amber-800" };
    if (order.payment_status === "failed") return { label: "Pago fallido", color: "bg-red-100 text-red-800" };
    if (order.payment_status === "processing") return { label: "Procesando pago", color: "bg-yellow-100 text-yellow-800" };
  }
  if (order.payment_status === "refunded") return { label: "Reembolsado", color: "bg-purple-100 text-purple-800" };
  return { label: statusLabels[order.status], color: statusColors[order.status] };
}

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: "preparing",
  preparing: "ready",
  ready: "picked_up",
};

export default function OrderCard({
  order,
  onUpdateStatus,
}: {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}) {
  const next = nextStatus[order.status];
  const time = new Date(order.created_at).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-lg font-bold text-dark">#{order.order_number}</span>
          <span className="text-sm text-dark/50 ml-2">{time}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLabel(order).color}`}>
          {getLabel(order).label}
        </span>
      </div>

      <div className="mb-3">
        <p className="font-medium text-dark">{order.customer_name}</p>
        <a href={`tel:${order.customer_phone}`} className="text-sm text-blue-600">
          {order.customer_phone}
        </a>
        <div className="flex gap-2 mt-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            order.order_type === "dine_in"
              ? "bg-purple-100 text-purple-800"
              : "bg-teal-100 text-teal-800"
          }`}>
            {order.order_type === "dine_in" ? "Comer aqui" : "Para llevar"}
          </span>
          {order.payment_method === "spei" && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              SPEI
            </span>
          )}
          {order.pickup_time && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Listo: {order.pickup_time}
            </span>
          )}
          {order.guests && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {order.guests} personas
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{item.name} x{item.quantity}</span>
            <span>${item.lineTotal}</span>
          </div>
        ))}
        <div className="border-t pt-1 flex justify-between font-bold text-sm">
          <span>Total</span>
          <span>${order.total} MXN</span>
        </div>
      </div>

      {next && (
        <button
          onClick={() => onUpdateStatus(order.id, next)}
          className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm cursor-pointer"
        >
          Marcar como: {statusLabels[next]}
        </button>
      )}

      {order.status !== "cancelled" && order.status !== "picked_up" && (
        <button
          onClick={() => onUpdateStatus(order.id, "cancelled")}
          className="w-full mt-2 text-red-400 hover:text-red-600 transition-colors text-xs cursor-pointer"
        >
          Cancelar pedido
        </button>
      )}
    </div>
  );
}
