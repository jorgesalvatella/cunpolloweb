"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setInstallPrompt(null);
  };

  if (!showBanner) return null;

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
            onClick={() => setShowBanner(false)}
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
