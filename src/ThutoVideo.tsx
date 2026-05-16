import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { CTA } from "./scenes/CTA";
import { Examples } from "./scenes/Examples";
import { Features } from "./scenes/Features";
import { Hero } from "./scenes/Hero";
import { HowItWorks } from "./scenes/HowItWorks";
import { Problem } from "./scenes/Problem";
import { colors } from "./styles/theme";

export function ThutoVideo() {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.offWhite }}>
      <Sequence from={0} durationInFrames={180}>
        <Hero />
      </Sequence>
      <Sequence from={180} durationInFrames={180}>
        <Problem />
      </Sequence>
      <Sequence from={360} durationInFrames={240}>
        <HowItWorks />
      </Sequence>
      <Sequence from={600} durationInFrames={220}>
        <Features />
      </Sequence>
      <Sequence from={820} durationInFrames={210}>
        <Examples />
      </Sequence>
      <Sequence from={1030} durationInFrames={170}>
        <CTA />
      </Sequence>
    </AbsoluteFill>
  );
}
