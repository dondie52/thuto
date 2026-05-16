import React from "react";
import { AbsoluteFill } from "remotion";
import { Background } from "../components/Background";
import { FadeUp } from "../components/FadeUp";
import { PhoneMockup } from "../components/PhoneMockup";
import { ThutoLogo } from "../components/ThutoLogo";
import { colors, fonts, layout } from "../styles/theme";

export function CTA() {
  return (
    <AbsoluteFill style={{ color: colors.white, fontFamily: fonts.body }}>
      <Background dark />
      <div style={{ padding: `${layout.top}px ${layout.safeX}px ${layout.bottom}px` }}>
        <FadeUp delay={8}>
          <ThutoLogo dark scale={1.04} />
        </FadeUp>
        <div style={{ marginTop: 120, maxWidth: 900 }}>
          <FadeUp delay={22}>
            <h2 style={{ margin: 0, fontFamily: fonts.heading, fontSize: 92, lineHeight: 0.96, fontWeight: 700, letterSpacing: 0 }}>
              Build your shortlist before applications open.
            </h2>
          </FadeUp>
          <FadeUp delay={38}>
            <p style={{ margin: "34px 0 0", color: "rgba(255,255,255,0.78)", fontSize: 33, lineHeight: 1.35, fontWeight: 500 }}>
              Use Thuto to check eligibility, compare programmes, and apply with more confidence.
            </p>
          </FadeUp>
          <FadeUp delay={54}>
            <div style={{ marginTop: 46, display: "inline-flex", borderRadius: 999, background: colors.teal, color: colors.white, padding: "23px 36px", fontSize: 30, fontWeight: 900, boxShadow: "0 24px 64px rgba(15,139,127,0.38)" }}>
              Open predictor
            </div>
          </FadeUp>
        </div>
        <div style={{ position: "absolute", right: 70, bottom: 260 }}>
          <PhoneMockup delay={68} compact />
        </div>
        <FadeUp delay={86} style={{ position: "absolute", left: layout.safeX, right: layout.safeX, bottom: 104 }}>
          <div>
            <div style={{ color: colors.lightTeal, fontSize: 27, fontWeight: 900 }}>Thuto · Botswana University Companion</div>
            <div style={{ marginTop: 14, color: "rgba(255,255,255,0.58)", fontSize: 20, lineHeight: 1.32, fontWeight: 600 }}>
              Eligibility is indicative only. Confirm final requirements with each institution.
            </div>
          </div>
        </FadeUp>
      </div>
    </AbsoluteFill>
  );
}
