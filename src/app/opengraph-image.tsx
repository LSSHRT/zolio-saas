import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const interBold = await fetch(
    new URL("https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2")
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0c0a1d 0%, #1a0533 50%, #0c0a1d 100%)",
          fontFamily: "Inter",
          padding: 80,
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #7c3aed, #d946ef, #f97316)",
          }}
        />

        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)",
            top: "-10%",
            right: "-5%",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(217,70,239,0.1), transparent 70%)",
            bottom: "-10%",
            left: "-5%",
          }}
        />

        {/* Logo circle */}
        <div
          style={{
            display: "flex",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #7c3aed, #d946ef)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            boxShadow: "0 8px 32px rgba(124,58,237,0.35)",
          }}
        >
          <span style={{ fontSize: 40, fontWeight: 900, color: "#fff" }}>Z</span>
        </div>

        {/* Main title */}
        <div style={{
          fontSize: 68,
          fontWeight: 900,
          color: "#ffffff",
          textAlign: "center",
          letterSpacing: "-2px",
          lineHeight: 1.1,
          marginBottom: 16,
        }}>
          Gérez vos chantiers.
        </div>
        <div style={{
          fontSize: 42,
          fontWeight: 700,
          background: "linear-gradient(90deg, #7c3aed, #d946ef)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
          letterSpacing: "-1px",
        }}>
          Pas la paperasse.
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 22,
          color: "#a0a0a0",
          textAlign: "center",
          marginTop: 24,
          maxWidth: 600,
        }}>
          Devis, factures et signature digitale — conçu pour les artisans du bâtiment.
        </div>

        {/* Bottom badge */}
        <div style={{
          display: "flex",
          marginTop: 48,
          padding: "12px 28px",
          borderRadius: 999,
          background: "rgba(124,58,237,0.15)",
          border: "1px solid rgba(124,58,237,0.3)",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#34d399",
          }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: "#e2e8f0" }}>
            1 devis offert • Sans carte bancaire
          </span>
        </div>

        {/* Bottom right Zolio.site */}
        <div style={{
          position: "absolute",
          bottom: 32,
          right: 48,
          fontSize: 20,
          fontWeight: 700,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "2px",
        }}>
          ZOLIO.SITE
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
