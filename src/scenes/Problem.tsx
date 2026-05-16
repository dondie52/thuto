import React from "react";
import { AbsoluteFill } from "remotion";
import { AnimatedCard } from "../components/AnimatedCard";
import { Background } from "../components/Background";
import { SectionTitle } from "../components/SectionTitle";
import { colors, fonts, layout } from "../styles/theme";

const problems = [
  "Many students are unsure which programmes their BGCSE points qualify for.",
  "Comparing requirements across universities takes too much time.",
  "Career paths and course details are often difficult to find before applying.",
];

export function Problem() {
  return (
    <AbsoluteFill style={{ fontFamily: fonts.body }}>
      <Background />
      <div style={{ padding: `${layout.top}px ${layout.safeX}px ${layout.bottom}px` }}>
        <SectionTitle title="Choosing a course shouldn't be guesswork" />
        <div style={{ marginTop: 72, display: "flex", flexDirection: "column", gap: 30 }}>
          {problems.map((body, index) => (
            <AnimatedCard key={body} delay={24 + index * 16} accent style={{ minHeight: 218, paddingLeft: 44 }}>
              <div style={{ color: colors.teal, fontSize: 25, fontWeight: 900 }}>0{index + 1}</div>
              <p style={{ margin: "16px 0 0", color: colors.navy, fontSize: 38, lineHeight: 1.18, fontWeight: 760 }}>{body}</p>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}
