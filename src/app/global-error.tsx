"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", backgroundColor: "#fff" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#b91c1c", marginBottom: "0.5rem" }}>
              CUNPOLLO
            </h1>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              Algo salio mal. Por favor intenta de nuevo.
            </p>
            <button
              onClick={reset}
              style={{
                backgroundColor: "#dc2626",
                color: "#fff",
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Intentar de nuevo
            </button>
            <br />
            <a href="/" style={{ color: "#dc2626", marginTop: "1rem", display: "inline-block" }}>
              Volver al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
