
import { NextRequest, NextResponse } from "next/server";
import { profileSchema } from "@/lib/qr-schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Received profile:", body);

    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid profile information",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile information is valid",
      profile: result.data,
    });

  } catch (error) {
    console.error("PROFILE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
        debugMessage: error instanceof Error
          ? error.message
          : String(error),
      },
      { status: 400 }
    );
  }
}
