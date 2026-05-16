import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AnimatedCard } from "../components/AnimatedCard";
import { Background } from "../components/Background";
import { SectionTitle } from "../components/SectionTitle";
import { colors, fonts, layout } from "../styles/theme";

const steps = [
  ["01", "Enter your BGCSE results", "Add your subjects and grades to calculate your points.", "A"],
  ["02", "Explore matching programmes", "See programmes that may match your points and subjects.", "✓"],
  ["03", "Compare your options", "Review modules, careers, and requirements before applying.", "≡"],
];

export function HowItWorks() {
  const frame = useCurrentFrame();
  const badgeScale = interpolate(frame, [90, 120, 180, 218], [0.88, 1.08, 1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: fonts.body }}>
      <Background />
      <div style={{ padding: `${layout.top}px ${layout.safeX}px ${layout.bottom}px` }}>
        <SectionTitle eyebrow="Simple predictor" title="How it works" subtitle="Start with your results, then move from matching programmes to a shortlist you can trust." />
        <div style={{ marginTop: 58, display: "flex", flexDirection: "column", gap: 24 }}>
          {steps.map(([number, title, body, icon], index) => (
            <AnimatedCard key={title} delay={38 + index * 18} style={{ minHeight: 210, display: "grid", gridTemplateColumns: "112px 1fr", gap: 26, alignItems: "center" }}>
              <div style={{ width: 92, height: 92, borderRadius: 28, background: colors.softMint, color: colors.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: 900 }}>
                {icon}
              </div>
              <div>
                <div style={{ color: colors.teal, fontSize: 24, fontWeight: 900, letterSpacing: 1.6 }}>{number}</div>
                <h3 style={{ margin: "8px 0 0", color: colors.navy, fontFamily: fonts.heading, fontSize: 42, lineHeight: 1, fontWeight: 700 }}>{title}</h3>
                <p style={{ margin: "12px 0 0", color: colors.mutedText, fontSize: 27, lineHeight: 1.32, fontWeight: 500 }}>{body}</p>
              </div>
            </AnimatedCard>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            right: 82,
            top: 500,
            transform: `scale(${badgeScale})`,
            borderRadius: 999,
            background: colors.teal,
            color: colors.white,
            padding: "20px 30px",
            fontSize: 32,
            fontWeight: 900,
            boxShadow: "0 22px 58px rgba(15,139,127,0.34)",
          }}
        >
          44 points
        </div>
      </div>
    </AbsoluteFill>
  );
}
