import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1310, #0d0a08)",
          borderRadius: 40,
        }}
      >
        <span
          style={{
            fontSize: 120,
            fontWeight: 900,
            background: "linear-gradient(135deg, #ff9a4d, #e84a00)",
            backgroundClip: "text",
            color: "#ff6b1a",
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size }
  );
}
