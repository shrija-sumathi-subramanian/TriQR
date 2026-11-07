
import { NextRequest, NextResponse } from "next/server";
import { profileSchema } from "@/lib/qr-schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request. Please check your submitted information.",
      },
      { status: 400 }
    );
  }
}
