"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase/client";
import OrderCard from "./OrderCard";
import type { Order, OrderStatus } from "@/types/order";

const tabs: { label: string; filter: string | null }[] = [
  { label: "Activos", filter: null },
  { label: "Pagados", filter: "paid" },
  { label: "Preparando", filter: "preparing" },
  { label: "Listos", filter: "ready" },
  { label: "Todos", filter: "all" },
];

export default function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const filter = tabs[activeTab].filter;
    const params = filter && filter !== "all" ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/orders${params}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime subscription + polling fallback
  useEffect(() => {
    const poll = setInterval(fetchOrders, 10_000);

    const sb = getSupabase();
    const channel = sb
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[orders] Realtime error, relying on polling");
        }
      });

    return () => {
      clearInterval(poll);
      sb.removeChannel(channel);
    };
  }, [fetchOrders]);

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      fetchOrders();
    }
  };

  const filtered = tabs[activeTab].filter === null
    ? orders.filter((o) => !["picked_up", "cancelled"].includes(o.status))
    : orders;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => { setActiveTab(i); setLoading(true); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === i
                ? "bg-red-600 text-white"
                : "bg-white text-dark/70 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark/30">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-dark/30">No hay pedidos</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
