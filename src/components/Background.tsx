import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../styles/theme";

type BackgroundProps = {
  dark?: boolean;
};

export function Background({ dark = false }: BackgroundProps) {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 1200], [0, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift = interpolate(frame, [0, 1200], [0, -50], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: dark
          ? `linear-gradient(180deg, ${colors.deepNavy} 0%, ${colors.navy} 58%, #0A342F 100%)`
          : colors.offWhite,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 820,
          height: 820,
          borderRadius: "50%",
          left: -260 + drift * 0.25,
          top: 120 + lift * 0.25,
          background: dark ? "rgba(15,139,127,0.25)" : "rgba(15,139,127,0.14)",
          filter: "blur(70px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          borderRadius: "50%",
          right: -260 - drift * 0.18,
          bottom: 80 - lift * 0.2,
          background: dark ? "rgba(191,243,234,0.12)" : "rgba(191,243,234,0.72)",
          filter: "blur(76px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: dark ? 0.1 : 0.18,
          backgroundImage:
            "linear-gradient(rgba(15,139,127,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(15,139,127,0.26) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          transform: `translate3d(${-drift * 0.15}px, ${lift * 0.12}px, 0)`,
        }}
      />
    </AbsoluteFill>
  );
}
