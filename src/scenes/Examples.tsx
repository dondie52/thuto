import React from "react";
import { AbsoluteFill } from "remotion";
import { AnimatedCard } from "../components/AnimatedCard";
import { Background } from "../components/Background";
import { SectionTitle } from "../components/SectionTitle";
import { colors, fonts, layout } from "../styles/theme";

const programmes = [
  ["University of Botswana", "BSc Computer Science", "From 42 points"],
  ["BIUST", "BSc Data Science", "From 43 points"],
  ["Botswana School of Business Sciences", "BCom Accounting", "From 38 points"],
];

export function Examples() {
  return (
    <AbsoluteFill style={{ fontFamily: fonts.body }}>
      <Background />
      <div style={{ padding: `${layout.top}px ${layout.safeX}px ${layout.bottom}px` }}>
        <SectionTitle title="With 44 points, you may qualify for programmes like these" />
        <div style={{ marginTop: 62, display: "flex", flexDirection: "column", gap: 24 }}>
          {programmes.map(([institution, programme, points], index) => (
            <AnimatedCard key={programme} delay={34 + index * 18} style={{ minHeight: 222 }}>
              <div style={{ color: colors.mutedText, fontSize: 25, fontWeight: 800 }}>{institution}</div>
              <div style={{ marginTop: 12, color: colors.navy, fontFamily: fonts.heading, fontSize: 48, lineHeight: 1, fontWeight: 700 }}>{programme}</div>
              <div style={{ marginTop: 24, display: "inline-flex", borderRadius: 999, background: colors.softMint, color: colors.teal, padding: "14px 20px", fontSize: 25, fontWeight: 900 }}>
                {points}
              </div>
            </AnimatedCard>
          ))}
        </div>
        <div style={{ position: "absolute", left: layout.safeX, right: layout.safeX, bottom: 96, color: colors.mutedText, fontSize: 24, lineHeight: 1.35, fontWeight: 650 }}>
          Subject requirements still apply. Always confirm with each institution.
        </div>
      </div>
    </AbsoluteFill>
  );
}
