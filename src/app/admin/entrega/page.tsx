"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/types/order";

export default function EntregaPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (data.role === "entrega" || data.role === "admin") {
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
    const res = await fetch("/api/admin/orders?status=ready");
    if (res.ok) {
      const data: Order[] = await res.json();
      setOrders(data);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchOrders();

    const channel = supabase
      .channel("entrega-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [authed, fetchOrders]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-dark/30 text-2xl">...</div>;
  }
  if (!authed) return null;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="CUNPOLLO" width={48} height={48} className="drop-shadow-[0_1px_4px_rgba(183,28,28,0.3)]" />
            <h1 className="text-2xl font-bold text-red-700">ENTREGA</h1>
          </div>
          <p className="text-dark/50 text-sm">{orders.length} pedido{orders.length !== 1 ? "s" : ""} listo{orders.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => router.push("/admin")}
          className="text-dark/50 text-sm hover:text-dark cursor-pointer"
        >
          Admin
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-dark/20 text-2xl">Sin pedidos listos para entregar</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const time = new Date(order.created_at).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const waitMin = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);

            return (
              <div key={order.id} className="rounded-2xl border-2 border-green-500 bg-green-50 p-5">
                {/* Customer info - prominent */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-dark">#{order.order_number}</span>
                    <span className="text-sm text-dark/50">{time} ({waitMin} min)</span>
                  </div>
                  <p className="text-2xl font-bold text-dark mt-2">{order.customer_name}</p>
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="text-blue-600 font-medium text-lg hover:underline"
                  >
                    {order.customer_phone}
                  </a>
                </div>

                {/* Order type */}
                <div className="flex gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.order_type === "dine_in"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-teal-100 text-teal-800"
                  }`}>
                    {order.order_type === "dine_in" ? "Comer aqui" : "Para llevar"}
                  </span>
                  {order.pickup_time && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {order.pickup_time}
                    </span>
                  )}
                  {order.guests && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {order.guests} pers.
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-1 mb-4 border-t border-green-200 pt-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium">${item.lineTotal}</span>
                    </div>
                  ))}
                  <div className="border-t border-green-200 pt-1 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${order.total} MXN</span>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => updateStatus(order.id, "picked_up")}
                  className="w-full py-3 rounded-xl font-bold text-lg bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
                >
                  ENTREGADO
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
