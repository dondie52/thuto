import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../components/Background";
import { FadeUp } from "../components/FadeUp";
import { PhoneMockup } from "../components/PhoneMockup";
import { ThutoLogo } from "../components/ThutoLogo";
import { colors, fonts, layout } from "../styles/theme";

export function Hero() {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 180], [1, 1.035], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ color: colors.white, fontFamily: fonts.body }}>
      <Background dark />
      <AbsoluteFill style={{ padding: `${layout.top}px ${layout.safeX}px ${layout.bottom}px`, transform: `scale(${zoom})`, transformOrigin: "center" }}>
        <FadeUp delay={8}>
          <ThutoLogo dark />
        </FadeUp>
        <div style={{ marginTop: 150 }}>
          <FadeUp delay={18}>
            <h1
              style={{
                margin: 0,
                maxWidth: 890,
                fontFamily: fonts.heading,
                fontSize: 94,
                lineHeight: 0.96,
                fontWeight: 700,
                letterSpacing: 0,
              }}
            >
              Find the courses you actually qualify for
            </h1>
          </FadeUp>
          <FadeUp delay={34}>
            <p style={{ margin: "36px 0 0", maxWidth: 830, color: "rgba(255,255,255,0.78)", fontSize: 33, lineHeight: 1.34, fontWeight: 500 }}>
              Use your BGCSE results to explore programmes, compare universities, and build a shortlist before applications open.
            </p>
          </FadeUp>
          <FadeUp delay={50}>
            <div style={{ marginTop: 48, display: "flex", gap: 18 }}>
              <div style={{ borderRadius: 999, background: colors.white, color: colors.navy, padding: "21px 30px", fontSize: 25, fontWeight: 850, boxShadow: "0 20px 54px rgba(0,0,0,0.22)" }}>
                Check eligibility
              </div>
              <div style={{ borderRadius: 999, border: "1px solid rgba(255,255,255,0.34)", background: "rgba(255,255,255,0.1)", color: colors.white, padding: "20px 28px", fontSize: 25, fontWeight: 800 }}>
                Browse programmes
              </div>
            </div>
          </FadeUp>
        </div>
        <div style={{ position: "absolute", right: 78, bottom: 90 }}>
          <PhoneMockup delay={74} compact />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
