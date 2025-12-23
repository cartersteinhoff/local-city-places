import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadEmailImage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    const url = await uploadEmailImage(file);

    if (!url) {
      // In dev without blob token, return a placeholder
      return NextResponse.json({
        url: `https://placehold.co/600x400?text=Dev+Image`,
      });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
