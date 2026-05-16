import React from "react";
import { Composition, registerRoot } from "remotion";
import { ThutoVideo } from "./ThutoVideo";
import { DURATION_IN_FRAMES, FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./styles/theme";

export function RemotionRoot() {
  return (
    <Composition
      id="ThutoBUC"
      component={ThutoVideo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
    />
  );
}

registerRoot(RemotionRoot);
