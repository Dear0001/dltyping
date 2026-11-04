import { ImageResponse } from "next/og";

export const alt = "DL Typing — Free English & Khmer typing practice";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#fff" }}>
        <div style={{ fontSize: 120, fontWeight: 800 }}>DL Typing</div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#94a3b8" }}>Free English &amp; Khmer typing practice</div>
      </div>
    ),
    size,
  );
}
