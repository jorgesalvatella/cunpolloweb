"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/types/order";

const statusColors: Record<string, string> = {
  paid: "bg-blue-500",
  preparing: "bg-orange-500",
};

const statusLabels: Record<string, string> = {
  paid: "NUEVO",
  preparing: "PREPARANDO",
};

export default function CocinaPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState(Date.now());
  const prevCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Tick every 30s to update wait times and alert colors
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (data.role === "cocina" || data.role === "admin") {
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
    const res = await fetch("/api/admin/orders");
    if (res.ok) {
      const data: Order[] = await res.json();
      const kitchen = data.filter((o) => o.status === "paid" || o.status === "preparing");
      // Play sound if new order arrived
      if (kitchen.filter((o) => o.status === "paid").length > prevCountRef.current) {
        audioRef.current?.play().catch(() => {});
      }
      prevCountRef.current = kitchen.filter((o) => o.status === "paid").length;
      setOrders(kitchen);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchOrders();

    const channel = supabase
      .channel("cocina-realtime")
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-2xl">...</div>;
  }
  if (!authed) return null;

  const paid = orders.filter((o) => o.status === "paid");
  const preparing = orders.filter((o) => o.status === "preparing");

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Hidden audio for notification */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczHjqIxN/LdEQzQYS91NZ1QS06fLTN0HxDMzh3q8XMfkYzNnWnvMN/SDQ0dKS5vYBKNTFyo7O5gEw3M3Gfr7WAUTcxcJ2rsoRUOy9tnaiuhlk9LmmcpKyKXz4sZJqhqI1kQCpjl5+ij2dEK16Wn5+PZ0csYJadn41nRyxgl5+ij2dEK16Wn5+PZ0Y=" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="CUNPOLLO" width={48} height={48} className="drop-shadow-[0_1px_6px_rgba(255,255,255,0.4)]" />
          <h1 className="text-3xl font-bold text-white">COCINA</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-white text-sm">{paid.length} nuevos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-white text-sm">{preparing.length} preparando</span>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="text-white/50 text-sm hover:text-white cursor-pointer"
          >
            Admin
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center justify-center h-[70vh]">
          <p className="text-white/30 text-3xl">Sin pedidos pendientes</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Paid orders first (newest first), then preparing */}
          {[...paid, ...preparing].map((order) => {
            const isPaid = order.status === "paid";
            const time = new Date(order.created_at).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            });
            // Check if pickup time is approaching (<=15 min left) and order still not started
            let minutesLeft: number | null = null;
            let isUrgent = false;
            if (isPaid && order.pickup_time) {
              const [h, m] = order.pickup_time.split(":").map(Number);
              const pickup = new Date();
              pickup.setHours(h, m, 0, 0);
              minutesLeft = Math.round((pickup.getTime() - now) / 60000);
              isUrgent = minutesLeft <= 15;
            }

            return (
              <div
                key={order.id}
                className={`rounded-2xl p-5 border-2 ${
                  isUrgent
                    ? "bg-red-950 border-red-500 animate-pulse"
                    : isPaid
                      ? "bg-blue-950 border-blue-500 animate-pulse"
                      : "bg-gray-800 border-orange-500"
                }`}
              >
                {/* Urgent alert banner */}
                {isUrgent && minutesLeft !== null && (
                  <div className="bg-red-600 text-white text-center text-sm font-bold py-1.5 rounded-lg mb-3">
                    {minutesLeft <= 0
                      ? `HORA PASADA — ${Math.abs(minutesLeft)} MIN DE RETRASO`
                      : `FALTAN ${minutesLeft} MIN — SIN ATENDER`}
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-black text-white">#{order.order_number}</span>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${isUrgent ? "bg-red-500" : statusColors[order.status]}`}>
                      {isUrgent ? "URGENTE" : statusLabels[order.status]}
                    </span>
                    <p className="text-white/50 text-sm mt-1">{time}</p>
                  </div>
                </div>

                {/* Order type badges */}
                <div className="flex gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    order.order_type === "dine_in"
                      ? "bg-purple-600 text-white"
                      : "bg-teal-600 text-white"
                  }`}>
                    {order.order_type === "dine_in" ? "COMER AQUI" : "PARA LLEVAR"}
                  </span>
                  {order.pickup_time && (
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-600 text-white">
                      {order.pickup_time}
                    </span>
                  )}
                  {order.guests && (
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-600 text-white">
                      {order.guests} pers.
                    </span>
                  )}
                </div>

                {/* Items - big and clear */}
                <div className="space-y-2 mb-5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-white text-lg">
                      <span className="font-bold">{item.quantity}x</span>
                      <span className="flex-1 ml-3">{item.name}</span>
                    </div>
                  ))}
                </div>

                {/* Action button */}
                {isPaid ? (
                  <button
                    onClick={() => updateStatus(order.id, "preparing")}
                    className="w-full py-4 rounded-xl text-xl font-black bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    EMPEZAR
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatus(order.id, "ready")}
                    className="w-full py-4 rounded-xl text-xl font-black bg-green-500 text-white hover:bg-green-600 transition-colors cursor-pointer"
                  >
                    LISTO
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
