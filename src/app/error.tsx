"use client";

import { useEffect } from "react";
import { RESTAURANT } from "@/lib/constants";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <section className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-700 mb-2">Algo salio mal</h1>
        <p className="text-dark/50 mb-6">
          Ocurrio un error inesperado. Por favor intenta de nuevo.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors cursor-pointer"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="text-red-600 font-semibold hover:text-red-700 transition-colors"
          >
            Volver al inicio
          </a>
          <a
            href={`https://wa.me/${RESTAURANT.phone.replace(/[\s+]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-dark/40 hover:text-dark/60 transition-colors"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
