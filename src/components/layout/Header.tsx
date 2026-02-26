"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import LanguageSwitcher from "./LanguageSwitcher";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/constants";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const t = useTranslations("nav");
  const { itemCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        scrolled
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
                  scrolled ? "text-dark" : "text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
            {FEATURES.ORDERING_ENABLED && itemCount > 0 && (
              <Link href="/cart" className="relative p-2">
                <svg className={cn("w-5 h-5", scrolled ? "text-dark" : "text-white")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg className={cn("w-5 h-5", scrolled ? "text-dark" : "text-white")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                scrolled ? "text-dark" : "text-white"
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
          </nav>
        </div>
      )}
    </header>
  );
}
