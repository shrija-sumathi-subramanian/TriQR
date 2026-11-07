
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";

const qrRequestSchema = z.object({
  links: z
    .array(
      z.object({
        url: z
          .string()
          .trim()
          .url("Enter a valid URL")
          .refine((value) => {
            try {
              const parsed = new URL(value);
              return (
                parsed.protocol === "http:" ||
                parsed.protocol === "https:"
              );
            } catch {
              return false;
            }
          }, "Only HTTP and HTTPS URLs are supported"),

        displayName: z
          .string()
          .trim()
          .max(50, "Display name must be under 50 characters")
          .optional()
          .default(""),
      })
    )
    .min(1, "Add at least one URL")
    .max(100, "You can generate up to 100 QR codes at once"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the submitted links.
    const validation = qrRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid QR generation request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { links } = validation.data;

    // Generate one QR code for every URL.
    const generatedQRs = await Promise.all(
      links.map(async (link, index) => {
        const qrCode = await QRCode.toDataURL(link.url, {
          errorCorrectionLevel: "H",
          type: "image/png",
          width: 512,
          margin: 4,
          color: {
            dark: "#2B2118",
            light: "#FFFFFF",
          },
        });

        return {
          id: index + 1,
          url: link.url,
          displayName: link.displayName,
          qrCode,
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: "QR codes generated successfully",
      totalGenerated: generatedQRs.length,
      qrCodes: generatedQRs,
    });
  } catch (error) {
    console.error("QR GENERATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate QR codes. Please try again.",
      },
      { status: 500 }
    );
  }
}
