"use client";

import type { ComponentProps } from "react";
import { LocalGuideDesign } from "./local-guide";

export function PhotoStripDesign(
  props: ComponentProps<typeof LocalGuideDesign>,
) {
  return <LocalGuideDesign {...props} heroVariant="photo-strip" />;
}
