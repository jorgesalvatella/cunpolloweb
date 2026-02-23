"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import { RESTAURANT } from "@/lib/constants";

export default function LocationSection() {
  const t = useTranslations("location");

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${RESTAURANT.coordinates.lat},${RESTAURANT.coordinates.lng}`;

  return (
    <section id="location" className="py-14 sm:py-20 bg-white">
      <Container>
        <div className="text-center mb-8 sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-600 mb-3 sm:mb-4 font-(family-name:--font-heading)"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-dark/60"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl sm:rounded-2xl overflow-hidden h-64 sm:h-80 lg:h-auto bg-red-500/5"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3721.428738509904!2d-86.8311241!3d21.135329499999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f4c2bcfcd79ad67%3A0xf9abba9ca2b09c95!2sPollo%20Rostizado%20Cunpollo!5e0!3m2!1ses-419!2smx!4v1771843435009!5m2!1ses-419!2smx"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 256 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="CUNPOLLO Location"
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center gap-6 sm:gap-8"
          >
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gold-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                {t("address")}
              </h3>
              <p className="text-dark text-base sm:text-lg leading-relaxed">
                {RESTAURANT.address.street}
                <br />
                {RESTAURANT.address.city}, {RESTAURANT.address.state}{" "}
                {RESTAURANT.address.zip}
              </p>
            </div>

            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gold-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                {t("hours")}
              </h3>
              <div className="space-y-1 text-dark text-base sm:text-lg">
                <p>
                  <span className="text-dark/60">{t("weekdays")}:</span>{" "}
                  {RESTAURANT.hours.weekdays}
                </p>
                <p>
                  <span className="text-dark/60">{t("weekends")}:</span>{" "}
                  {RESTAURANT.hours.weekends}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gold-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                {t("phone")}
              </h3>
              <a
                href={`tel:${RESTAURANT.phone}`}
                className="text-dark text-base sm:text-lg hover:text-gold-500 transition-colors"
              >
                {RESTAURANT.phone}
              </a>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg w-full sm:w-fit text-base sm:text-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t("getDirections")}
            </a>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
