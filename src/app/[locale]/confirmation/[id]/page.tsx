"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { RESTAURANT, FEATURES, REWARDS_URL } from "@/lib/constants";
import { useCart } from "@/context/CartContext";
import type { Order } from "@/types/order";

export default function ConfirmationPage() {
  const t = useTranslations("confirmation");
  const tRewards = useTranslations("rewards");
  const { id } = useParams<{ id: string }>();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

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

        // Clear cart after confirming payment was successful
        const isPaidStatus = ["paid", "preparing", "ready", "picked_up"].includes(data?.status);
        if (isPaidStatus) {
          clearCart();
        }
      } catch {}
      setLoading(false);
    }
    loadOrder();
  }, [id, clearCart]);

  // Poll for SPEI payment confirmation every 10 seconds
  useEffect(() => {
    if (!order || order.payment_status !== "pending_spei") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (data && data.payment_status !== "pending_spei") {
          setOrder(data);
          if (["paid", "preparing", "ready", "picked_up"].includes(data.status)) {
            clearCart();
          }
        }
      } catch {}
    }, 10000);

    return () => clearInterval(interval);
  }, [id, order?.payment_status, clearCart]);

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
  const isPendingSpei = order.payment_method === "spei" && order.payment_status === "pending_spei";

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

    const typeLabel = order.order_type === "dine_in" ? t("dineIn") : t("pickup");
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
          ) : isPendingSpei ? (
            <>
              {/* SPEI pending icon — clock */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-blue-700 font-(family-name:--font-heading) mb-2"
              >
                {t("speiPendingTitle")}
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
                className="bg-blue-50 rounded-2xl p-6 my-8 text-left"
              >
                {/* Amount */}
                <div className="text-center mb-5">
                  <div className="text-sm text-blue-700 mb-1">{t("speiAmount")}</div>
                  <span className="text-3xl font-bold text-red-700">${order.total} MXN</span>
                </div>

                {order.spei_details && (
                  <div className="space-y-4">
                    {/* BBVA Section */}
                    <div className="bg-white rounded-xl p-4">
                      <div className="font-bold text-dark mb-3">{t("speiBbvaTitle")}</div>
                      <p className="text-sm text-dark/60 mb-3">{t("speiBbvaStep1")}</p>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-dark/40">{t("speiBbvaConvenio")}</div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-mono font-bold text-dark text-lg">{order.spei_details.agreement}</span>
                            <button type="button" onClick={() => copyToClipboard(order.spei_details!.agreement, "agreement")} className="shrink-0 px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors cursor-pointer">
                              {copiedField === "agreement" ? t("copied") : "Copiar"}
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-dark/60">{t("speiBbvaStep2")}</p>

                        <div>
                          <div className="text-xs text-dark/40">{t("speiBbvaReferencia")}</div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-mono font-bold text-dark text-sm">{order.spei_details.name}</span>
                            <button type="button" onClick={() => copyToClipboard(order.spei_details!.name, "name")} className="shrink-0 px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors cursor-pointer">
                              {copiedField === "name" ? t("copied") : "Copiar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 border-t border-blue-200" />
                      <span className="text-xs text-blue-400 font-semibold uppercase">{t("speiOrOtherBank")}</span>
                      <div className="flex-1 border-t border-blue-200" />
                    </div>

                    {/* Other banks Section */}
                    <div className="bg-white rounded-xl p-4">
                      <div className="font-bold text-dark mb-3">{t("speiOtherBankTitle")}</div>
                      <p className="text-sm text-dark/60 mb-3">{t("speiOtherBankStep")}</p>

                      <div className="space-y-2.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-dark/50">{t("speiBeneficiary")}</span>
                          <span className="font-semibold text-dark">CUNPOLLO</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dark/50">{t("speiDestBank")}</span>
                          <span className="font-semibold text-dark">BBVA Bancomer</span>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm">
                            <span className="text-dark/50">{t("speiClabe")}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-mono font-bold text-dark text-sm">{order.spei_details.clabe}</span>
                            <button type="button" onClick={() => copyToClipboard(order.spei_details!.clabe, "clabe")} className="shrink-0 px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors cursor-pointer">
                              {copiedField === "clabe" ? t("copied") : "Copiar"}
                            </button>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm">
                            <span className="text-dark/50">{t("speiPaymentConcept")}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-mono font-bold text-dark text-sm">{order.spei_details.name}</span>
                            <button type="button" onClick={() => copyToClipboard(order.spei_details!.name, "name2")} className="shrink-0 px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition-colors cursor-pointer">
                              {copiedField === "name2" ? t("copied") : "Copiar"}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dark/50">{t("speiReference")}</span>
                          <span className="font-semibold text-dark">{order.spei_details.agreement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-blue-200 text-center">
                  <p className="text-sm text-blue-700">{t("speiInstructionsConfirmation")}</p>
                </div>

                {/* Polling indicator */}
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-600">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("speiWaiting")}
                </div>
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
                {order.payment_method === "spei" ? t("speiConfirmed") : t("title")}
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

          {/* Rewards CTA */}
          {FEATURES.REWARDS_ENABLED && isPaid && (
            <motion.a
              href={REWARDS_URL}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="flex items-center gap-4 bg-gold-500/10 border border-gold-500/20 rounded-2xl p-5 mb-6 hover:bg-gold-500/15 transition-colors group"
            >
              <div className="w-12 h-12 bg-gold-500 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-gold-600 text-sm">{tRewards("confirmationBanner")}</p>
                <p className="text-dark/50 text-xs">{tRewards("subtitle")}</p>
              </div>
              <span className="px-4 py-2 bg-gold-500 text-white text-sm font-semibold rounded-full group-hover:bg-gold-600 transition-colors shrink-0">
                {tRewards("confirmationCta")}
              </span>
            </motion.a>
          )}

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
