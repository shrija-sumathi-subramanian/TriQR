
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { qrLinkSchema } from "@/lib/qr-schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = qrLinkSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid QR information",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const { type, label, value } = result.data;

    let qrContent = value;

    if (type === "email") {
      qrContent = `mailto:${value}`;
    }

    if (type === "phone") {
      qrContent = `tel:${value}`;
    }

    const qrCode = await QRCode.toDataURL(qrContent);

    return NextResponse.json({
      success: true,
      type,
      label,
      qrCode,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "QR code generation failed",
      },
      { status: 500 }
    );
  }
}
