import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FindWhoAmAI — AI-powered guessing game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
        FindWhoAmAI
      </div>
      <div style={{ fontSize: 36, marginTop: 24, opacity: 0.9 }}>
        AI-powered guessing game
      </div>
    </div>,
    { ...size },
  );
}
