
import type { ShapeId } from "@/lib/shape-config";

export type FontChoice =
  | "serif"
  | "modern-sans"
  | "geometric-sans"
  | "bold-display";

export type SurfaceFinish = "matte" | "glossy" | "metallic";

export type AppearanceSettings = {
  /** One colour shared by every solid face and edge. */
  color: string;

  /** Shared typography settings for every face. */
  font: FontChoice;
  fontColor: string;
  fontSize: number;

  /** One finish shared by the complete solid model. */
  finish: SurfaceFinish;

  /**
   * Legacy fields retained temporarily so existing scene files
   * continue to type-check while they are being updated.
   * The new controls do not use these fields.
   */
  faceColors: Record<string, string>;
  edgeColor: string;
};

export const COLOR_PRESETS = [
  { name: "Porcelain", value: "#F8F4EC" },
  { name: "Apricot", value: "#E39B67" },
  { name: "Espresso", value: "#49362B" },
  { name: "Sage", value: "#A8B5A0" },
  { name: "Sky", value: "#A9C5D8" },
  { name: "Lavender", value: "#C5B8D8" },
  { name: "Blush", value: "#E8B9B1" },
  { name: "Terracotta", value: "#BD765B" },
  { name: "Charcoal", value: "#454545" },
  { name: "Butter", value: "#E8D79A" },
];

export const FONT_CHOICES: {
  value: FontChoice;
  label: string;
  sample: string;
}[] = [
  { value: "serif", label: "Serif", sample: "Aa" },
  { value: "modern-sans", label: "Modern Sans", sample: "Aa" },
  { value: "geometric-sans", label: "Geometric Sans", sample: "Aa" },
  { value: "bold-display", label: "Bold Display", sample: "Aa" },
];

export const FINISH_CHOICES: {
  value: SurfaceFinish;
  label: string;
  description: string;
}[] = [
  {
    value: "matte",
    label: "Matte",
    description: "Soft, low-shine surface",
  },
  {
    value: "glossy",
    label: "Glossy",
    description: "Smooth reflective surface",
  },
  {
    value: "metallic",
    label: "Metallic",
    description: "Metal-like reflective surface",
  },
];

export function createDefaultAppearance(
  _shapeId: ShapeId
): AppearanceSettings {
  return {
    color: "#F8F4EC",

    // Legacy compatibility fields.
    faceColors: {},
    edgeColor: "#F8F4EC",

    font: "serif",
    fontColor: "#49362B",
    fontSize: 0.42,
    finish: "matte",
  };
}
