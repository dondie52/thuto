import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles/theme";
import { FadeUp } from "./FadeUp";

type PhoneMockupProps = {
  delay?: number;
  compact?: boolean;
};

const rows = [
  ["UB", "Computer Science", "42 pts"],
  ["BIUST", "Data Science", "43 pts"],
  ["BSBS", "Accounting", "38 pts"],
];

export function PhoneMockup({ delay = 0, compact = false }: PhoneMockupProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 105, mass: 0.8 } });
  const glow = interpolate(frame, [delay + 16, delay + 60, delay + 120], [0.18, 0.34, 0.22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <FadeUp delay={delay} distance={52}>
      <div
        style={{
          width: compact ? 438 : 490,
          borderRadius: 58,
          padding: 18,
          background: "linear-gradient(180deg, #102033, #050B16)",
          boxShadow: `0 42px 110px rgba(5,11,22,0.38), 0 0 0 9px rgba(191,243,234,${glow})`,
          transform: `scale(${0.94 + scale * 0.06})`,
        }}
      >
        <div
          style={{
            minHeight: compact ? 730 : 820,
            borderRadius: 44,
            background: colors.offWhite,
            overflow: "hidden",
            padding: 32,
            fontFamily: fonts.body,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: 84, height: 10, borderRadius: 999, background: "#D8DFE7" }} />
            <div style={{ color: colors.teal, fontSize: 22, fontWeight: 800 }}>Thuto</div>
          </div>
          <div
            style={{
              marginTop: 34,
              borderRadius: 30,
              padding: 26,
              background: `linear-gradient(135deg, ${colors.navy}, #0A3C37)`,
              color: colors.white,
            }}
          >
            <div style={{ fontSize: 25, color: colors.lightTeal, fontWeight: 800 }}>BGCSE Points</div>
            <div style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 112, lineHeight: 0.95, fontWeight: 700 }}>44</div>
            <div style={{ marginTop: 16, display: "inline-flex", borderRadius: 999, padding: "10px 16px", background: "rgba(255,255,255,0.14)", fontSize: 18, fontWeight: 700 }}>
              Strong shortlist
            </div>
          </div>
          <div style={{ marginTop: 30, color: colors.navy, fontSize: 25, fontWeight: 800 }}>Matching programmes</div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {rows.map(([abbr, programme, points], index) => (
              <div
                key={programme}
                style={{
                  borderRadius: 22,
                  border: `1px solid ${colors.cardBorder}`,
                  background: colors.white,
                  padding: 18,
                  display: "grid",
                  gridTemplateColumns: "58px 1fr auto",
                  gap: 14,
                  alignItems: "center",
                  opacity: interpolate(frame, [delay + 22 + index * 9, delay + 42 + index * 9], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 15, background: colors.softMint, color: colors.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>
                  {abbr}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: colors.navy, fontSize: 20, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{programme}</div>
                  <div style={{ marginTop: 5, color: colors.mutedText, fontSize: 16, fontWeight: 600 }}>May match results</div>
                </div>
                <div style={{ color: colors.teal, fontSize: 18, fontWeight: 900 }}>{points}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FadeUp>
  );
}
