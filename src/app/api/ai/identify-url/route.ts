
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const identificationSchema = z.object({
  category: z.enum([
    "linkedin",
    "github",
    "instagram",
    "youtube",
    "portfolio",
    "company",
    "project",
    "website",
    "other",
  ]),
  platform: z.string().min(1).max(60),
  confidence: z.enum(["high", "medium", "low"]),
  reason: z.string().min(1).max(200),
});

function detectKnownPlatform(url: URL) {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();

  if (
    host === "linkedin.com" ||
    host.endsWith(".linkedin.com")
  ) {
    return {
      category: "linkedin",
      platform: "LinkedIn",
      confidence: "high",
      reason: "The URL belongs to LinkedIn.",
    };
  }

  if (
    host === "github.com" ||
    host.endsWith(".github.com")
  ) {
    return {
      category: "github",
      platform: "GitHub",
      confidence: "high",
      reason: path === "/" 
        ? "The URL belongs to GitHub."
        : "The URL points to a GitHub profile or repository.",
    };
  }

  if (
    host === "instagram.com" ||
    host.endsWith(".instagram.com")
  ) {
    return {
      category: "instagram",
      platform: "Instagram",
      confidence: "high",
      reason: "The URL belongs to Instagram.",
    };
  }

  if (
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "youtu.be"
  ) {
    return {
      category: "youtube",
      platform: "YouTube",
      confidence: "high",
      reason: "The URL belongs to YouTube.",
    };
  }

  if (
    host === "vercel.app" ||
    host.endsWith(".vercel.app")
  ) {
    return {
      category: "website",
      platform: "Vercel-hosted website",
      confidence: "high",
      reason: "The domain indicates Vercel hosting, but not the website's purpose.",
    };
  }

  if (
    host === "netlify.app" ||
    host.endsWith(".netlify.app")
  ) {
    return {
      category: "website",
      platform: "Netlify-hosted website",
      confidence: "high",
      reason: "The domain indicates Netlify hosting, but not the website's purpose.",
    };
  }

  if (
    host === "medium.com" ||
    host.endsWith(".medium.com")
  ) {
    return {
      category: "website",
      platform: "Medium",
      confidence: "high",
      reason: "The URL belongs to Medium.",
    };
  }

  if (
    host === "behance.net" ||
    host.endsWith(".behance.net")
  ) {
    return {
      category: "portfolio",
      platform: "Behance",
      confidence: "high",
      reason: "The URL belongs to Behance, a creative portfolio platform.",
    };
  }

  if (
    host === "dribbble.com" ||
    host.endsWith(".dribbble.com")
  ) {
    return {
      category: "portfolio",
      platform: "Dribbble",
      confidence: "high",
      reason: "The URL belongs to Dribbble, a design portfolio platform.",
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const inputSchema = z.object({
      url: z.string().trim().url(),
    });

    const inputResult = inputSchema.safeParse(body);

    if (!inputResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid URL.",
          details: inputResult.error.issues,
        },
        { status: 400 }
      );
    }

    const url = new URL(inputResult.data.url);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Only HTTP and HTTPS URLs are supported.",
        },
        { status: 400 }
      );
    }

    // Stage 1: Recognise known platforms without AI.
    const knownPlatform = detectKnownPlatform(url);

    if (knownPlatform) {
      return NextResponse.json({
        success: true,
        identificationMethod: "platform-detection",
        result: knownPlatform,
      });
    }

    // Stage 2: Ask Gemini to classify an unfamiliar URL.
    const prompt = `
You are the URL identification assistant for TriQR.

Classify the following URL into exactly one category:

linkedin
github
instagram
youtube
portfolio
company
project
website
other

URL: ${url.toString()}

Important rules:
1. Use only information visible in the URL.
2. Do not claim that you visited or inspected the website.
3. A hosting domain such as Vercel or Netlify does not prove
   whether a site is a portfolio, company or project.
4. If the purpose cannot be determined, use website or other.
5. Do not invent information.
6. Use high confidence only for clearly identifiable platforms.
7. Return valid JSON only.

Return this structure:
{
  "category": "website",
  "platform": "Unknown website",
  "confidence": "low",
  "reason": "The URL does not reveal its purpose."
}
`;

    const response = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: prompt,
    });

    const output = response.output_text;

    if (!output) {
      throw new Error("Gemini returned an empty response.");
    }

    const cleanedOutput = output
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsedOutput = JSON.parse(cleanedOutput);

    const aiResult = identificationSchema.safeParse(parsedOutput);

    if (!aiResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "AI returned an invalid identification result.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      identificationMethod: "gemini-ai",
      result: aiResult.data,
    });

  } catch (error) {
    console.error("URL IDENTIFICATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to identify this URL. Please try again.",
      },
      { status: 500 }
    );
  }
}
