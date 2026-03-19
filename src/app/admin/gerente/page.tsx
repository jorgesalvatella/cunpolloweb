"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/types/order";

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Pagado", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Preparando", color: "bg-orange-100 text-orange-800" },
  ready: { label: "Listo", color: "bg-green-100 text-green-800" },
  picked_up: { label: "Entregado", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

function getDisplayStatus(order: Order): { label: string; color: string } {
  if (order.status === "pending") {
    if (order.payment_status === "pending_3ds") {
      return { label: "Esperando pago 3DS", color: "bg-amber-100 text-amber-800" };
    }
    if (order.payment_status === "failed") {
      return { label: "Pago fallido", color: "bg-red-100 text-red-800" };
    }
    if (order.payment_status === "processing") {
      return { label: "Procesando pago", color: "bg-yellow-100 text-yellow-800" };
    }
  }
  if (order.payment_status === "refunded") {
    return { label: "Reembolsado", color: "bg-purple-100 text-purple-800" };
  }
  return statusConfig[order.status];
}

export default function GerentePage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (data.role === "gerente" || data.role === "admin") {
          setAuthed(true);
        } else {
          router.push("/admin/login");
        }
        setChecking(false);
      })
      .catch(() => {
        router.push("/admin/login");
        setChecking(false);
      });
  }, [router]);

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders?status=all");
    if (res.ok) {
      const data: Order[] = await res.json();
      setOrders(data);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchOrders();

    const channel = supabase
      .channel("gerente-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [authed, fetchOrders]);

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-dark/30 text-2xl">...</div>;
  }
  if (!authed) return null;

  // Stats
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const completed = todayOrders.filter((o) => o.status === "picked_up");
  const revenue = completed.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = completed.length > 0 ? Math.round(revenue / completed.length) : 0;
  const dineIn = todayOrders.filter((o) => o.order_type === "dine_in").length;
  const pickup = todayOrders.filter((o) => o.order_type === "pickup").length;

  // Status counts
  const statusCounts: Record<string, number> = {};
  for (const o of todayOrders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }

  // Alerts: orders waiting more than 15 min without being prepared
  const alerts = todayOrders.filter((o) => {
    if (o.status !== "paid") return false;
    const waitMin = (Date.now() - new Date(o.created_at).getTime()) / 60000;
    return waitMin > 15;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="CUNPOLLO" width={48} height={48} className="drop-shadow-[0_1px_4px_rgba(183,28,28,0.3)]" />
          <h1 className="text-2xl font-bold text-red-700">GERENTE</h1>
        </div>
        <button
          onClick={() => router.push("/admin")}
          className="text-dark/50 text-sm hover:text-dark cursor-pointer"
        >
          Admin
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-red-700 mb-2">Pedidos sin atender (+15 min)</h3>
          <div className="space-y-1">
            {alerts.map((o) => {
              const waitMin = Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000);
              return (
                <p key={o.id} className="text-red-700 text-sm">
                  <span className="font-bold">#{o.order_number}</span> — {o.customer_name} — esperando {waitMin} min
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-dark/50 text-sm">Pedidos hoy</p>
          <p className="text-3xl font-black text-dark">{todayOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-dark/50 text-sm">Ingresos</p>
          <p className="text-3xl font-black text-green-700">${revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-dark/50 text-sm">Ticket promedio</p>
          <p className="text-3xl font-black text-dark">${avgTicket}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-dark/50 text-sm">Entregados</p>
          <p className="text-3xl font-black text-dark">{completed.length}</p>
        </div>
      </div>

      {/* Order type split + status board */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-bold text-dark mb-3">Tipo de pedido</h3>
          <div className="flex gap-4">
            <div className="flex-1 text-center bg-purple-50 rounded-lg p-3">
              <p className="text-2xl font-black text-purple-700">{dineIn}</p>
              <p className="text-sm text-purple-600">Comer aqui</p>
            </div>
            <div className="flex-1 text-center bg-teal-50 rounded-lg p-3">
              <p className="text-2xl font-black text-teal-700">{pickup}</p>
              <p className="text-sm text-teal-600">Para llevar</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-bold text-dark mb-3">Por status</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(statusConfig) as OrderStatus[]).map((s) => (
              <div key={s} className={`px-3 py-2 rounded-lg text-center ${statusConfig[s].color}`}>
                <p className="text-xl font-bold">{statusCounts[s] || 0}</p>
                <p className="text-xs">{statusConfig[s].label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <h3 className="font-bold text-dark p-4 border-b">Pedidos del dia</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-dark/70">
              <tr>
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Hora</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Items</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {todayOrders.map((order) => {
                const time = new Date(order.created_at).toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold">{order.order_number}</td>
                    <td className="px-4 py-3 text-dark/60">{time}</td>
                    <td className="px-4 py-3">{order.customer_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        order.order_type === "dine_in"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-teal-100 text-teal-800"
                      }`}>
                        {order.order_type === "dine_in" ? "Aqui" : "Llevar"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark/60">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">${order.total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getDisplayStatus(order).color}`}>
                        {getDisplayStatus(order).label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {todayOrders.length === 0 && (
          <p className="text-center py-8 text-dark/30">Sin pedidos hoy</p>
        )}
      </div>
    </div>
  );
}
