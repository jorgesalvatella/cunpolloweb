"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "cunpollo-pwa-dismissed";
const DISMISS_DAYS = 14;

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS|Chrome/.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);
}

function wasDismissedRecently(): boolean {
  try {
    const val = localStorage.getItem(DISMISS_KEY);
    if (!val) return false;
    const dismissedAt = parseInt(val, 10);
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 inline-block align-text-bottom text-blue-500"
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 inline-block align-text-bottom"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Already installed — don't show anything
    if (isStandalone() || wasDismissedRecently()) return;

    // iOS Safari: show manual instructions
    if (isIosSafari()) {
      setShowIos(true);
      return;
    }

    // Android/Chrome: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowAndroid(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setShowAndroid(false);
    setShowIos(false);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowAndroid(false);
    }
    setInstallPrompt(null);
  };

  // Android banner
  if (showAndroid) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 flex items-center gap-3">
          <img src="/icon-96x96.png" alt="" className="w-12 h-12 rounded-xl" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-dark text-sm">Instalar CUNPOLLO</p>
            <p className="text-dark/50 text-xs">Acceso rapido al menu</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={dismiss}
              className="text-dark/40 text-xs hover:text-dark cursor-pointer"
            >
              No
            </button>
            <button
              onClick={handleInstall}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 cursor-pointer"
            >
              Instalar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari banner
  if (showIos) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 relative">
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 text-dark/30 hover:text-dark cursor-pointer"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <img src="/icon-96x96.png" alt="" className="w-12 h-12 rounded-xl" />
            <div>
              <p className="font-bold text-dark">Instalar CUNPOLLO</p>
              <p className="text-dark/50 text-xs">Agrega la app a tu pantalla de inicio</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold shrink-0">1</span>
              <p className="text-sm text-dark">
                Toca el boton <ShareIcon /> de abajo en Safari
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold shrink-0">2</span>
              <p className="text-sm text-dark">
                Busca <span className="font-semibold">&quot;Agregar a inicio&quot;</span> <PlusIcon />
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold shrink-0">3</span>
              <p className="text-sm text-dark">
                Toca <span className="font-semibold">&quot;Agregar&quot;</span> y listo
              </p>
            </div>
          </div>

          {/* Arrow pointing down to Safari toolbar */}
          <div className="flex justify-center mt-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-dark/30 animate-bounce">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
