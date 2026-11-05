
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import {
  aiDesignSchema,
} from "@/lib/ai-design-schema";

// Validate the user's design preference
const preferenceSchema = (await import("zod")).z.object({
  stylePreference: (await import("zod")).z
    .string()
    .trim()
    .max(100)
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Check the API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured",
        },
        { status: 500 }
      );
    }

    // 2. Read and validate the user's preference
    const body = await request.json();

    const preferenceResult = preferenceSchema.safeParse(body);

    if (!preferenceResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid design preference",
        },
        { status: 400 }
      );
    }

    const stylePreference =
      preferenceResult.data.stylePreference ||
      "Create a professional and modern design";

    // 3. Initialize Gemini
    const ai = new GoogleGenAI({ apiKey });

    // 4. Prepare the AI design instructions
    const prompt = `
You are the AI visual design engine for TriQR.

TriQR is a 3D personal identity cube that displays QR codes
on three of its faces.

Generate a complete visual theme for the cube.

USER DESIGN PREFERENCE:
${stylePreference}

DESIGN RULES:

1. Create a professional, visually attractive colour palette.
2. Use hexadecimal colours in #RRGGBB format.
3. Ensure sufficient contrast between text and background.
4. Keep QR code faces readable and suitable for scannable QR codes.
5. Never generate QR code patterns or QR code images.
6. The front, right and left faces are reserved for QR codes.
7. The top face is reserved for TriQR branding.
8. The bottom face is reserved for the user's name.
9. The back face can contain decorative elements.
10. Select typography only from:
    modern, minimal, futuristic, classic.
11. Select decorations only from:
    none, dots, lines, geometric, glow.
12. Return no more than four decorations.
13. Return only valid JSON. Do not include Markdown.

Return exactly this JSON structure:

{
  "themeName": "Example Theme",
  "palette": {
    "primary": "#2563EB",
    "secondary": "#7C3AED",
    "background": "#0F172A",
    "surface": "#1E293B",
    "text": "#FFFFFF",
    "accent": "#38BDF8"
  },
  "faceColors": {
    "front": "#FFFFFF",
    "right": "#FFFFFF",
    "left": "#FFFFFF",
    "top": "#2563EB",
    "bottom": "#1E293B",
    "back": "#0F172A"
  },
  "typography": {
    "heading": "modern",
    "body": "minimal"
  },
  "decorations": ["geometric", "glow"]
}
`;

    // 5. Ask Gemini to generate the design
    const response = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: prompt,
    });

    // 6. Read the AI response
    const output = response.output_text;

    if (!output) {
      throw new Error("Gemini returned an empty response");
    }

    // 7. Remove Markdown formatting if present
    const cleanedOutput = output
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    // 8. Convert JSON text into an object
    const parsedOutput = JSON.parse(cleanedOutput);

    // 9. Validate the generated design
    const designResult = aiDesignSchema.safeParse(parsedOutput);

    if (!designResult.success) {
      console.error(
        "INVALID AI DESIGN:",
        designResult.error.issues
      );

      return NextResponse.json(
        {
          success: false,
          error: "AI generated an invalid design",
        },
        { status: 502 }
      );
    }

    // 10. Return the validated design
    return NextResponse.json({
      success: true,
      message: "AI design generated successfully",
      designMethod: "gemini-ai",
      design: designResult.data,
    });

  } catch (error) {
    console.error("AI DESIGN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "AI design generation failed",
      },
      { status: 500 }
    );
  }
}
