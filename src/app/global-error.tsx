"use client";

import Link from "next/link";

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
        fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "radial-gradient(ellipse at top, rgba(124,58,237,0.15) 0%, transparent 60%), #0c0a1d",
        color: "#f8fafc",
        margin: 0,
        padding: "1rem",
        boxSizing: "border-box",
      }}>
        <div style={{
          textAlign: "center",
          maxWidth: "440px",
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.5rem",
          padding: "2.5rem 1.75rem",
          boxShadow: "0 28px 70px -36px rgba(0,0,0,0.6)",
        }}>
          {/* Logo wordmark */}
          <p style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            color: "#c4b5fd",
            margin: "0 0 1.5rem 0",
          }}>
            ZOLIO
          </p>

          {/* Icon-ish badge */}
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "1.25rem",
            background: "rgba(244,63,94,0.15)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
            fontSize: "2rem",
          }}>
            ⚠️
          </div>

          <h1 style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            margin: "0 0 0.5rem 0",
            letterSpacing: "-0.01em",
          }}>
            Oups, quelque chose s&apos;est mal passé
          </h1>
          <p style={{
            color: "#94a3b8",
            margin: "0 0 1.5rem 0",
            lineHeight: 1.55,
          }}>
            Une erreur inattendue s&apos;est produite. Pas de panique, vos données sont en sécurité.
          </p>

          {error?.digest ? (
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "0.625rem",
              padding: "0.75rem 0.9rem",
              margin: "0 0 1.5rem 0",
              textAlign: "left",
              fontSize: "0.75rem",
              color: "#cbd5e1",
            }}>
              <p style={{ margin: 0, fontWeight: 600, letterSpacing: "0.05em", color: "#94a3b8", textTransform: "uppercase" }}>
                Référence support
              </p>
              <p style={{ margin: "0.25rem 0 0 0", fontFamily: "ui-monospace, monospace", color: "#e2e8f0", wordBreak: "break-all" }}>
                {error.digest}
              </p>
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <button
              onClick={reset}
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)",
                color: "white",
                border: "none",
                padding: "0.85rem 1.5rem",
                borderRadius: "0.75rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 10px 30px -10px rgba(124,58,237,0.5)",
              }}
            >
              Réessayer
            </button>
            <Link
              href="/"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "0.85rem 1.5rem",
                borderRadius: "0.75rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
