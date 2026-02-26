"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OrdersDashboard from "@/components/admin/OrdersDashboard";

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

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
        <h1 className="text-2xl font-bold text-red-700">CUNPOLLO - Pedidos</h1>
        <button
          onClick={() => {
            document.cookie = "cunpollo-admin=; Max-Age=0; path=/";
            router.push("/admin/login");
          }}
          className="text-sm text-dark/50 hover:text-dark cursor-pointer"
        >
          Cerrar sesión
        </button>
      </div>
      <OrdersDashboard />
    </div>
  );
}
