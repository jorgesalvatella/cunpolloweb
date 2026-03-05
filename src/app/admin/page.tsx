"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OrdersDashboard from "@/components/admin/OrdersDashboard";
import WhatsAppHub from "@/components/admin/WhatsAppHub";

const mainTabs = [
  { label: "Pedidos", id: "orders" },
  { label: "WhatsApp", id: "whatsapp" },
];

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    // Quick auth check by trying to fetch orders
    fetch("/api/admin/orders")
      .then((res) => {
        if (res.ok) {
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

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-dark/30">...</div>
      </div>
    );
  }

  if (!authed) return null;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-red-700">CUNPOLLO - Admin</h1>
        <button
          onClick={() => {
            document.cookie = "cunpollo-admin=; Max-Age=0; path=/";
            router.push("/admin/login");
          }}
          className="text-sm text-dark/50 hover:text-dark cursor-pointer"
        >
          Cerrar sesion
        </button>
      </div>

      {/* Main tabs */}
      <div className="flex gap-2 mb-6 border-b pb-3">
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              activeTab === tab.id
                ? "bg-red-600 text-white"
                : "bg-white text-dark/70 hover:bg-gray-100 border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "orders" && <OrdersDashboard />}
      {activeTab === "whatsapp" && <WhatsAppHub />}
    </div>
  );
}
