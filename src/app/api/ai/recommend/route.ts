
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import { profileSchema } from "@/lib/qr-schema";
import { aiRecommendationSchema } from "@/lib/ai-recommendation-schema";

// Initialize the Gemini client using the private API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // 1. Check whether the API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured",
        },
        { status: 500 }
      );
    }

    // 2. Receive the user's profile
    const body = await request.json();

    // 3. Validate the profile using Zod
    const profileResult = profileSchema.safeParse(body);

    if (!profileResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid profile information",
          details: profileResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { links } = profileResult.data;

    // 4. Send only link metadata to Gemini
    const linkInformation = links.map((link, index) => ({
      index,
      type: link.type,
      label: link.label,
    }));

    // 5. Prepare the AI instruction
    const prompt = `
You are the AI recommendation engine for TriQR.

TriQR is a digital identity cube that displays three QR codes
representing the most useful links of a person.

Your task is to select the best links from the supplied list.

Rules:
1. Select only indexes from the supplied links.
2. Never invent links or indexes.
3. Consider professional usefulness and personal identity.
4. Prefer a balanced selection of useful professional and
   contact links.
5. Select exactly three links if at least three are available.
6. If fewer than three links are available, select all of them.
7. Never select the same index twice.
8. Return only JSON without Markdown or explanations.

Available links:
${JSON.stringify(linkInformation)}

Return this JSON structure:
{
  "recommendedIndexes": [0, 1, 2]
}
`;

    // 6. Ask Gemini for recommendations
    const response = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: prompt,
    });

    // 7. Read Gemini's response
    const output = response.output_text;

    if (!output) {
      throw new Error("Gemini returned an empty response");
    }

    // 8. Convert the JSON text into a JavaScript object
    const cleanedOutput = output
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsedOutput = JSON.parse(cleanedOutput);

    // 9. Validate Gemini's response using Zod
    const aiResult = aiRecommendationSchema.safeParse(parsedOutput);

    if (!aiResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned an invalid recommendation",
        },
        { status: 502 }
      );
    }

    const recommendedIndexes = aiResult.data.recommendedIndexes;

    // 10. Ensure every recommended index exists
    const indexesAreValid = recommendedIndexes.every(
      (index) => index < links.length
    );

    if (!indexesAreValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini selected an unavailable link",
        },
        { status: 502 }
      );
    }

    // 11. Separate recommended links from additional links
    const recommendedSet = new Set(recommendedIndexes);

    const recommendedLinks = recommendedIndexes.map(
      (index) => links[index]
    );

    const additionalLinks = links.filter(
      (_, index) => !recommendedSet.has(index)
    );

    // 12. Send the final result
    return NextResponse.json({
      success: true,
      message: "AI recommendations generated successfully",
      recommendationMethod: "gemini-ai",
      recommendedLinks,
      additionalLinks,
    });

  } catch (error) {
    console.error("AI RECOMMENDATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "AI recommendation failed",
      },
      { status: 500 }
    );
  }
}
