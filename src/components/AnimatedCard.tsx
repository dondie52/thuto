import React from "react";
import { colors, cardShadow } from "../styles/theme";
import { FadeUp } from "./FadeUp";

type AnimatedCardProps = {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  accent?: boolean;
};

export function AnimatedCard({ children, delay = 0, style, accent = false }: AnimatedCardProps) {
  return (
    <FadeUp delay={delay} distance={42}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 28,
          border: `1px solid ${colors.cardBorder}`,
          background: colors.white,
          boxShadow: cardShadow,
          padding: 32,
          ...style,
        }}
      >
        {accent ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 30,
              width: 7,
              height: 78,
              borderRadius: "0 999px 999px 0",
              background: colors.teal,
            }}
          />
        ) : null}
        {children}
      </div>
    </FadeUp>
  );
}
