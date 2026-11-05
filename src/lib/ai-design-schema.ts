
import { z } from "zod";

// Reusable validation for hexadecimal colours
const colorSchema = z.string().regex(
  /^#[0-9A-Fa-f]{6}$/,
  "Enter a valid hexadecimal colour"
);

// Allowed typography styles
const fontSchema = z.enum([
  "modern",
  "minimal",
  "futuristic",
  "classic",
]);

// Allowed decorative styles
const decorationSchema = z.enum([
  "none",
  "dots",
  "lines",
  "geometric",
  "glow",
]);

// Complete AI cube design configuration
export const aiDesignSchema = z.object({

  themeName: z.string().trim().min(1).max(40),

  palette: z.object({
    primary: colorSchema,
    secondary: colorSchema,
    background: colorSchema,
    surface: colorSchema,
    text: colorSchema,
    accent: colorSchema,
  }),

  faceColors: z.object({
    front: colorSchema,
    right: colorSchema,
    left: colorSchema,
    top: colorSchema,
    bottom: colorSchema,
    back: colorSchema,
  }),

  typography: z.object({
    heading: fontSchema,
    body: fontSchema,
  }),

  decorations: z.array(decorationSchema).max(4),

});

export type AIDesign = z.infer<typeof aiDesignSchema>;
