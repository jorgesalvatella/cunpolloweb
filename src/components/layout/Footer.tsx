import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import { FEATURES, RESTAURANT, REWARDS_URL } from "@/lib/constants";

export default function Footer() {
  const t = useTranslations("footer");
  const tRewards = useTranslations("rewards");

  return (
    <footer className="bg-red-600 text-white py-10 sm:py-12">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Image
              src="/logo.png"
              alt="CUNPOLLO"
              width={140}
              height={48}
              className="h-12 w-auto mb-4 brightness-110"
            />
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              {RESTAURANT.address.street}
              <br />
              {RESTAURANT.address.city}, {RESTAURANT.address.state}{" "}
              {RESTAURANT.address.zip}
            </p>
            <div className="flex flex-wrap gap-3">
              {FEATURES.ORDERING_ENABLED && (
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-gold-500 text-white font-semibold rounded-full text-sm hover:bg-gold-600 transition-colors"
                >
                  {t("orderNow")}
                </Link>
              )}
              {FEATURES.REWARDS_ENABLED && (
                <a
                  href={REWARDS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white font-bold rounded-full text-sm hover:bg-white/25 transition-colors border border-white/20"
                >
                  <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {tRewards("nav")}
                </a>
              )}
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold text-gold-400 mb-3">{t("hours")}</h4>
            <p className="text-white/70 text-sm leading-relaxed">
              {t("weekdays")}: {RESTAURANT.hours.weekdays}
              <br />
              {t("weekends")}: {RESTAURANT.hours.weekends}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gold-400 mb-3">
              {t("contact")}
            </h4>
            <p className="text-white/70 text-sm mb-4">
              <a
                href={`tel:${RESTAURANT.phone}`}
                className="hover:text-gold-400 transition-colors"
              >
                {RESTAURANT.phone}
              </a>
              <br />
              <a
                href={`mailto:${RESTAURANT.email}`}
                className="hover:text-gold-400 transition-colors break-all"
              >
                {RESTAURANT.email}
              </a>
            </p>
            <h4 className="font-semibold text-gold-400 mb-3">
              {t("followUs")}
            </h4>
            <div className="flex gap-5">
              <a
                href={RESTAURANT.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-gold-400 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={RESTAURANT.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-gold-400 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href={RESTAURANT.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-gold-400 transition-colors"
                aria-label="TikTok"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/40 text-xs sm:text-sm space-y-2">
          <div className="flex items-center justify-center gap-4">
            <Link href="/terminos" className="hover:text-gold-400 transition-colors">
              {t("terms")}
            </Link>
            <span>|</span>
            <Link href="/privacidad" className="hover:text-gold-400 transition-colors">
              {t("privacy")}
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} CUNPOLLO. {t("rights")}</p>
        </div>
      </Container>
    </footer>
  );
}
