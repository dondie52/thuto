import React from "react";
import { colors, fonts } from "../styles/theme";

type ThutoLogoProps = {
  dark?: boolean;
  scale?: number;
};

export function ThutoLogo({ dark = false, scale = 1 }: ThutoLogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, transform: `scale(${scale})`, transformOrigin: "left center" }}>
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 18,
          background: colors.teal,
          color: colors.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 31,
          boxShadow: "0 18px 44px rgba(15, 139, 127, 0.32)",
        }}
      >
        ◫
      </div>
      <div>
        <div style={{ fontFamily: fonts.heading, fontSize: 42, lineHeight: 0.9, fontWeight: 700, color: dark ? colors.white : colors.navy }}>
          Thuto
        </div>
        <div style={{ marginTop: 7, fontFamily: fonts.body, fontSize: 18, fontWeight: 800, letterSpacing: 3, color: dark ? colors.lightTeal : colors.teal }}>
          BUC
        </div>
      </div>
    </div>
  );
}
