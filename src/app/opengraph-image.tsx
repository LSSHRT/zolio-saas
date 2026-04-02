import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const interData = await fetch(
    "https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2"
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0c0a1d 0%, #1a0533 50%, #0c0a1d 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #7c3aed, #d946ef)",
            marginBottom: 24,
            color: "white",
            fontSize: 40,
            fontWeight: 900,
          }}
        >
          Z
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-2px",
          }}
        >
          G&#233;rez vos chantiers.
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            background: "linear-gradient(90deg, #7c3aed, #d946ef)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginTop: 10,
          }}
        >
          Pas la paperasse.
        </div>
        <p
          style={{
            fontSize: 22,
            color: "#a0a0b0",
            marginTop: 20,
            textAlign: "center",
          }}
        >
          Devis, factures et signature digitale pour les artisans du b&#226;timent.
        </p>
        <div
          style={{
            marginTop: 40,
            padding: "10px 24px",
            borderRadius: 999,
            border: "1px solid rgba(124,58,237,0.3)",
            background: "rgba(124,58,237,0.15)",
            display: "flex",
            gap: 8,
            alignItems: "center",
            color: "#e2e8f0",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#34d399",
              display: "inline-block",
            }}
          />
          1 devis offert
          {" • "}Sans carte bancaire
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 48,
            fontSize: 20,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: 2,
          }}
        >
          ZOLIO.SITE
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interData,
          weight: 700,
        },
      ],
    }
  );
}
