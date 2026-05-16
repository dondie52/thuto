import React from "react";
import { colors, fonts } from "../styles/theme";
import { FadeUp } from "./FadeUp";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  dark?: boolean;
  delay?: number;
};

export function SectionTitle({ eyebrow, title, subtitle, align = "left", dark = false, delay = 0 }: SectionTitleProps) {
  return (
    <FadeUp delay={delay}>
      <div style={{ textAlign: align, color: dark ? colors.white : colors.navy }}>
        {eyebrow ? (
          <div
            style={{
              color: dark ? colors.lightTeal : colors.teal,
              fontFamily: fonts.body,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 3.5,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <h2
          style={{
            margin: 0,
            fontFamily: fonts.heading,
            fontSize: 76,
            lineHeight: 0.98,
            fontWeight: 700,
            letterSpacing: 0,
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            style={{
              margin: "24px 0 0",
              color: dark ? "rgba(255,255,255,0.78)" : colors.mutedText,
              fontFamily: fonts.body,
              fontSize: 31,
              lineHeight: 1.35,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </FadeUp>
  );
}
