import { ImageResponse } from "next/og";
import { Logo } from "@/components/Logo";

export const alt = "Cinetable · il cineforum tra amici, con la suspense degli Oscar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 96, background: "#1a1718", color: "#ece5dc", fontFamily: "Georgia, serif" }}>
        <Logo size={120} />
        <div style={{ fontSize: 132, marginTop: 24, display: "flex" }}>Cinetable</div>
        <div style={{ width: 160, height: 2, background: "#c9a24a", marginTop: 32, display: "flex" }} />
        <div style={{ fontSize: 44, marginTop: 32, opacity: 0.75, display: "flex" }}>Il cineforum tra amici, con la suspense degli Oscar</div>
      </div>
    ),
    size,
  );
}
