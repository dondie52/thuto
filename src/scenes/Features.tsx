import React from "react";
import { AbsoluteFill } from "remotion";
import { AnimatedCard } from "../components/AnimatedCard";
import { Background } from "../components/Background";
import { SectionTitle } from "../components/SectionTitle";
import { colors, fonts, layout } from "../styles/theme";

const features = [
  ["▥", "Admission predictor", "Calculate your points and explore programmes that may match your results."],
  ["⌕", "Programme explorer", "Browse programmes, requirements, careers, and modules in one place."],
  ["⌂", "University profiles", "Compare institutions, locations, and application timelines."],
  ["⇄", "Course comparison", "Compare up to three programmes side by side."],
];

export function Features() {
  return (
    <AbsoluteFill style={{ fontFamily: fonts.body }}>
      <Background />
      <div style={{ padding: `${layout.top}px ${layout.safeX}px ${layout.bottom}px` }}>
        <SectionTitle title="Built for Botswana applicants" subtitle="A calm place to compare choices before applications open." />
        <div style={{ marginTop: 70, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {features.map(([icon, title, body], index) => (
            <AnimatedCard key={title} delay={30 + index * 12} style={{ minHeight: 364, padding: 28 }}>
              <div style={{ width: 76, height: 76, borderRadius: 24, background: colors.softMint, color: colors.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: 900 }}>
                {icon}
              </div>
              <h3 style={{ margin: "28px 0 0", color: colors.navy, fontFamily: fonts.heading, fontSize: 36, lineHeight: 1, fontWeight: 700 }}>{title}</h3>
              <p style={{ margin: "17px 0 0", color: colors.mutedText, fontSize: 24, lineHeight: 1.32, fontWeight: 500 }}>{body}</p>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}
