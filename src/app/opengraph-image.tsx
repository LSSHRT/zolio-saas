import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Zolio - Votre gestion d'entreprise simplifiée";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to right, #1e1b4b, #312e81)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: "bold",
            letterSpacing: "-0.05em",
            background: "linear-gradient(to right, #818cf8, #c7d2fe)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 20,
          }}
        >
          Zolio
        </div>
        <div
          style={{
            fontSize: 48,
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
            opacity: 0.9,
          }}
        >
          Devis, factures et pilotage simplifiés pour les indépendants.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
