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
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  const addressFull = `${RESTAURANT.address.street}, ${RESTAURANT.address.city}, ${RESTAURANT.address.state} ${RESTAURANT.address.zip}`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${RESTAURANT.coordinates.lat},${RESTAURANT.coordinates.lng}`;

  return (
    <section className="pt-28 pb-16 min-h-screen bg-white">
      <Container>
        <div className="max-w-lg mx-auto text-center">
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
            <p className="text-xl font-bold text-red-700">{t("message")}</p>
          </motion.div>

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
