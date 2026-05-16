import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type FadeUpProps = {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: React.CSSProperties;
};

export function FadeUp({ children, delay = 0, distance = 34, duration = 24, style }: FadeUpProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 22, stiffness: 120, mass: 0.75 },
    durationInFrames: duration,
  });
  const opacity = interpolate(frame, [delay, delay + duration * 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${(1 - progress) * distance}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
