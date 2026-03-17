"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { RESTAURANT } from "@/lib/constants";
import type { Order } from "@/types/order";

export default function ConfirmationPage() {
  const t = useTranslations("confirmation");
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        // If returning from 3D Secure, verify the payment first
        const url = new URL(window.location.href);
        if (url.searchParams.has("id")) {
          await fetch(`/api/orders/${id}/verify`, { method: "POST" });
          // Clean URL params after verification
          window.history.replaceState({}, "", url.pathname);
        }

        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        setOrder(data);
      } catch {}
      setLoading(false);
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <section className="pt-28 pb-16 min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-dark/30 text-lg">...</div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="pt-28 pb-16 min-h-screen bg-white">
        <Container>
          <div className="text-center py-20">
            <p className="text-dark/50 text-lg">Pedido no encontrado</p>
          </div>
        </Container>
      </section>
    );
  }

  const isPaid = order.status === "paid" || order.status === "preparing" || order.status === "ready" || order.status === "picked_up";
  const isFailed = order.status === "cancelled" || order.payment_status === "failed";

  const addressFull = `${RESTAURANT.address.street}, ${RESTAURANT.address.city}, ${RESTAURANT.address.state} ${RESTAURANT.address.zip}`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${RESTAURANT.coordinates.lat},${RESTAURANT.coordinates.lng}`;

  async function downloadReceipt() {
    if (!order) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(24);
    doc.setTextColor(183, 28, 28); // red-700
    doc.text("CUNPOLLO", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(t("title"), pageW / 2, y, { align: "center" });
    y += 12;

    // Order info
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${t("orderNumber")} #${order.order_number}`, 20, y);
    y += 7;

    const date = new Date(order.created_at);
    doc.text(date.toLocaleString(), 20, y);
    y += 7;

    if (order.customer_name) {
      doc.text(order.customer_name, 20, y);
      y += 7;
    }

    const typeLabel = order.order_type === "dine_in" ? "Comer en restaurante" : "Para llevar";
    doc.text(`Tipo: ${typeLabel}`, 20, y);
    y += 7;
    if (order.pickup_time) {
      doc.text(`Hora: ${order.pickup_time}`, 20, y);
      y += 7;
    }
    if (order.guests) {
      doc.text(`Personas: ${order.guests}`, 20, y);
      y += 7;
    }
    y += 3;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageW - 20, y);
    y += 8;

    // Items header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(t("summary"), 20, y);
    y += 8;

    // Items
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    for (const item of order.items) {
      doc.text(`${item.name} x${item.quantity}`, 20, y);
      doc.text(`$${item.lineTotal.toFixed(2)}`, pageW - 20, y, { align: "right" });
      y += 6;
    }

    // Total separator
    y += 2;
    doc.line(20, y, pageW - 20, y);
    y += 8;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Total", 20, y);
    doc.setTextColor(183, 28, 28);
    doc.text(`$${order.total.toFixed(2)} MXN`, pageW - 20, y, { align: "right" });
    y += 12;

    // Restaurant address
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(RESTAURANT.name, 20, y);
    y += 5;
    doc.text(addressFull, 20, y);
    y += 5;
    doc.text(RESTAURANT.phone, 20, y);
    y += 12;

    // Thank you
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(t("message"), pageW / 2, y, { align: "center" });

    doc.save(`cunpollo-pedido-${order.order_number}.pdf`);
  }

  return (
    <section className="pt-28 pb-16 min-h-screen bg-white">
      <Container>
        <div className="max-w-lg mx-auto text-center">
          {isFailed ? (
            <>
              {/* Failed payment icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-red-700 font-(family-name:--font-heading) mb-2"
              >
                {t("paymentFailed")}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-dark/50 mb-2"
              >
                {t("orderNumber")} #{order.order_number}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-red-50 rounded-2xl p-6 my-8"
              >
                <p className="text-lg text-red-700">{t("paymentFailedMessage")}</p>
              </motion.div>
            </>
          ) : (
            <>
              {/* Animated checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-red-700 font-(family-name:--font-heading) mb-2"
              >
                {t("title")}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-dark/50 mb-2"
              >
                {t("orderNumber")} #{order.order_number}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-red-50 rounded-2xl p-6 my-8"
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.order_type === "dine_in"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-teal-100 text-teal-800"
                  }`}>
                    {order.order_type === "dine_in" ? t("dineIn") : t("pickup")}
                  </span>
                  {order.pickup_time && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                      {t("readyBy")} {order.pickup_time}
                    </span>
                  )}
                  {order.guests && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      {order.guests} {t("guests")}
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold text-red-700">{t("message")}</p>
              </motion.div>
            </>
          )}

          {/* Order summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-50 rounded-xl p-4 mb-6 text-left"
          >
            <h3 className="font-bold text-dark mb-3">{t("summary")}</h3>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span>{item.name} x{item.quantity}</span>
                <span>${item.lineTotal}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-red-700">${order.total} MXN</span>
            </div>
          </motion.div>

          {/* Restaurant info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-3 mb-8"
          >
            <div className="text-sm text-dark/70">
              <p className="font-semibold text-dark">{t("address")}</p>
              <p>{addressFull}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center"
              >
                {t("directions")}
              </a>
              <a
                href={`tel:${RESTAURANT.phone.replace(/\s/g, "")}`}
                className="flex-1 bg-gray-100 text-dark px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
              >
                {t("call")}
              </a>
            </div>
            {isPaid && (
              <button
                onClick={downloadReceipt}
                className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors text-center mt-3"
              >
                {t("downloadReceipt")}
              </button>
            )}
          </motion.div>

          <Link
            href="/"
            className="text-red-600 font-semibold hover:text-red-700 transition-colors"
          >
            {t("backHome")}
          </Link>
        </div>
      </Container>
    </section>
  );
}
