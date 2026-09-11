import { ImageResponse } from "next/og";
export const alt = "Gym4Me — Discover, train, progress";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#111214",
        color: "#f3f3f4",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 80,
        justifyContent: "center",
      }}
    >
      <div style={{ color: "#19ee64", fontSize: 110, fontWeight: 800 }}>
        GYM4ME
      </div>
      <div style={{ fontSize: 46, marginTop: 24 }}>
        Discover. Train. Progress.
      </div>
      <div style={{ fontSize: 26, marginTop: 60, color: "#babbbe" }}>
        gym4me.ir
      </div>
    </div>,
    size,
  );
}
