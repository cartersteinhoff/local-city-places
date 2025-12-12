import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadCheckImage, validateImageFormat, validateImageSize } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only merchants and admins can upload check images
    if (session.user.role !== "merchant" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || type !== "check") {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Validate image format
    const formatValidation = validateImageFormat(base64);
    if (!formatValidation.valid) {
      return NextResponse.json({ error: formatValidation.error }, { status: 400 });
    }

    // Validate image size (10MB for check images)
    const sizeValidation = validateImageSize(base64, 10 * 1024 * 1024);
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 413 });
    }

    // Upload to blob storage
    const url = await uploadCheckImage(base64, file.name);

    if (!url) {
      return NextResponse.json(
        { error: "Upload failed - storage not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
