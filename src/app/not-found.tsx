"use client";

import { motion } from "framer-motion";

const BOT_AVATAR = "https://igwu4bqzucdjjkup.public.blob.vercel-storage.com/Public/botsitocunpollo.png";

export default function RootNotFound() {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem", textAlign: "center" }}>
          <motion.img
            src={BOT_AVATAR}
            alt="CunPollo"
            style={{ width: 224, height: 224, objectFit: "contain" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          />

          <h1 style={{ fontSize: "5rem", fontWeight: 900, color: "#dc2626", margin: "0.5rem 0" }}>
            404
          </h1>

          <p style={{ fontSize: "1.25rem", color: "#374151", marginBottom: "0.5rem" }}>
            Este pollo se perdio...
          </p>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "2rem" }}>
            La pagina que buscas no existe, pero nuestro menu si.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="/es/menu"
              style={{ background: "#dc2626", color: "#fff", padding: "0.75rem 2rem", borderRadius: "9999px", fontWeight: 600, textDecoration: "none" }}
            >
              Ver el Menu
            </a>
            <a
              href="/es"
              style={{ background: "#fff", color: "#dc2626", padding: "0.75rem 2rem", borderRadius: "9999px", fontWeight: 600, textDecoration: "none", border: "2px solid #dc2626" }}
            >
              Ir al Inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
