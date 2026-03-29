"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        background: "#0a0a0a",
        color: "#fafafa",
        margin: 0,
        padding: "1rem",
      }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Oups, quelque chose s&apos;est mal passé
          </h1>
          <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
            Une erreur inattendue s&apos;est produite. Pas de panique, tes données sont en sécurité.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
