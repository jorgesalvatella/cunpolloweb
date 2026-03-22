"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import LanguageSwitcher from "./LanguageSwitcher";
import { cn } from "@/lib/utils";
import { FEATURES, REWARDS_URL } from "@/lib/constants";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const t = useTranslations("nav");
  const tRewards = useTranslations("rewards");
  const { itemCount } = useCart();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // On non-home pages, always use the solid (scrolled) style
  const solid = !isHome || scrolled;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/" as const, label: t("home") },
    { href: "/menu" as const, label: t("menu") },
    { href: "/#location" as const, label: t("location") },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        solid
          ? "bg-white/95 backdrop-blur-md shadow-md"
          : "bg-transparent"
      )}
    >
      <Container>
        <div className="flex items-center justify-between h-18 sm:h-20 md:h-24">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt="CUNPOLLO"
              width={200}
              height={80}
              className="h-14 sm:h-18 md:h-20 lg:h-24 w-auto drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-medium transition-colors hover:text-gold-500 text-sm lg:text-base",
                  solid ? "text-dark" : "text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
            {FEATURES.REWARDS_ENABLED && (
              <a
                href={REWARDS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md",
                  solid
                    ? "bg-gold-500 text-white hover:bg-gold-600"
                    : "bg-gold-500 text-white hover:bg-gold-600"
                )}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {tRewards("nav")}
              </a>
            )}
            {FEATURES.ORDERING_ENABLED && (
              <Link
                href="/menu"
                className={cn(
                  "px-5 py-2 rounded-full font-semibold text-sm transition-all",
                  solid
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-white text-red-600 hover:bg-gold-300"
                )}
              >
                {t("order")}
              </Link>
            )}
            {FEATURES.ORDERING_ENABLED && itemCount > 0 && (
              <Link href="/cart" className="relative p-2">
                <svg className={cn("w-5 h-5", solid ? "text-dark" : "text-white")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{itemCount}</span>
              </Link>
            )}
            <LanguageSwitcher />
          </nav>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 md:hidden">
            {FEATURES.ORDERING_ENABLED && itemCount > 0 && (
              <Link href="/cart" className="relative p-2">
                <svg className={cn("w-5 h-5", solid ? "text-dark" : "text-white")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{itemCount}</span>
              </Link>
            )}
            <LanguageSwitcher />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "p-2 cursor-pointer",
                solid ? "text-dark" : "text-white"
              )}
              aria-label="Toggle menu"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <nav className="flex flex-col py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-6 py-4 text-dark font-medium hover:bg-red-50 transition-colors text-base active:bg-red-100"
              >
                {link.label}
              </Link>
            ))}
            {FEATURES.REWARDS_ENABLED && (
              <a
                href={REWARDS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="mx-4 my-2 py-3 bg-gold-500/10 border-2 border-gold-500 text-gold-600 font-bold rounded-full text-center hover:bg-gold-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {tRewards("nav")}
              </a>
            )}
            {FEATURES.ORDERING_ENABLED && (
              <Link
                href="/menu"
                onClick={() => setMobileOpen(false)}
                className="mx-4 my-2 py-3 bg-gold-500 text-white font-semibold rounded-full text-center hover:bg-gold-600 transition-colors"
              >
                {t("order")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
