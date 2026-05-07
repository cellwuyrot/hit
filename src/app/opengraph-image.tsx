import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "#e94560",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
              color: "white",
              fontWeight: 800,
            }}
          >
            TH
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            ТОПХИТ
          </div>
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Интернет-магазин товаров оптом и в розницу
        </div>
        <div
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.5)",
            marginTop: "16px",
          }}
        >
          tophitt.ru
        </div>
      </div>
    ),
    { ...size }
  );
}
